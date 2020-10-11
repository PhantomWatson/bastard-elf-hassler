class HassleResolver {
  constructor() {
    this.round = 1;
    this.hassleNum = 1;
    this.elfDiceContainer = document.getElementById('elf-dice-container');
    this.hassleDiceContainer = document.getElementById('hassle-dice-container');
    this.prepareFormSubmit();
    this.prepareMultiHassleCheckbox();
    this.prepareResetButtons();
    this.prepareModal();
    this.prepareAddHassleButton();
    this.prepareRemoveHassleButton();
    this.prepareEffortInputs();
    this.getEffortSpentField().focus();
    this.prepareFooter();
    this.prepareEffortSpendingAdvice();
    this.updateEffortSpendingAdvice();
    this.prepareAutoRerollSelectors();
    this.prepareCanRerollToggler();

    // Flags for indicating what actions to take when concluding this round
    this.resetConcludeRoundFlags();
  }

  prepareAutoRerollSelectors() {
    ['elf', 'hassle'].forEach(function (section) {
      const checkbox = document.getElementById(`${section}-auto-reroll`);
      const diceContainer = document.getElementById(`${section}-reroll-options`);
      checkbox.addEventListener('change', function (event) {
        diceContainer.style.display = event.target.checked ? 'block' : 'none';
      });
      const dice = diceContainer.querySelectorAll('.die');
      dice.forEach(function (die) {
        die.addEventListener('click', function (event) {
          const dataset = event.target.dataset;
          dataset.selected = dataset.selected === '1' ? '0' : '1';
        })
      });
    });
  }

  handleFormSubmit() {
    this.clearDice();
    if (!this.validate()) {
      return;
    }
    this.deductEffort();
    this.rollElfDice();
    this.rollHassleDice(this.getCurrentHassle().fists, this.hassleDiceContainer);
    this.handleRollResults();
    this.showFormResetButton();
  }

  handleRollResults() {
    this.getElfTotal();
    this.getHassleTotal();
    console.log(`totals are now ${this.elfTotal} vs. ${this.hassleTotal}`);
    const isWin = this.elfTotal > this.hassleTotal;
    const isMultiple = this.getIsMultipleHassle();
    if (isWin) {
      if (isMultiple) {
        this.handleMultipleHassleWin();
      } else {
        this.handleSingleHassleWin();
      }
    } else {
      if (isMultiple) {
        this.handleMultipleHassleLoss();
      } else {
        this.handleSingleHassleLoss();
      }
    }
  }

  validate() {
    return true;
  }

  rollElfDice() {
    let die;
    let needsRerolled;
    const autoRerollTargets = this.getElfAutoRerollTargets();
    for (let n = 0; n < this.getElfFists(); n++) {
      die = this.getRandomDie();
      this.elfDiceContainer.appendChild(die);
      needsRerolled = autoRerollTargets.indexOf(die.dataset.value) !== -1;
      if (needsRerolled) {
        this.markRerolled(die);
        this.elfDiceContainer.appendChild(this.getRerollIcon());
        this.elfDiceContainer.appendChild(this.getRandomDie());
      }
    }
    this.getWinningElfDie();

    if (this.isUsingCat()) {
      document.getElementById('familiar-cat').checked = false;
    }
  }

  getRandomDie() {
    const numbers = [
      ['one', 1],
      ['two', 2],
      ['three', 3],
      ['four', 4],
      ['five', 5],
      ['six', 6],
    ];
    const key = Math.floor(Math.random() * 6);
    const number = numbers[key];
    const numberWord = number[0];
    const numberDigit = number[1];
    const die = document.createElement('i');
    die.classList.add('fas');
    die.classList.add(`fa-dice-${numberWord}`);
    die.classList.add('die');
    die.setAttribute('data-value', numberDigit);
    this.addRerollHandler(die);
    return die;
  }

  rollHassleDice(fists, container) {
    const autoRerollTargets = this.getHassleAutoRerollTargets();
    let die;
    let needsRerolled;
    for (let n = 0; n < fists; n++) {
      die = this.getRandomDie();
      container.appendChild(die);
      needsRerolled = autoRerollTargets.indexOf(die.dataset.value) !== -1;
      if (needsRerolled) {
        this.markRerolled(die);
        container.appendChild(this.getRerollIcon());
        container.appendChild(this.getRandomDie());
      }
    }
    this.getWinningHassleDie();
  }

  getWinningElfDie() {
    const dice = document.querySelectorAll('#elf-dice-container .die');
    this.elfRollResult = this.getWinningDie(dice);
  }

  getWinningHassleDie() {
    const dice = document.getElementById('hassle-dice-container').childNodes;
    this.hassleRollResult = this.getWinningDie(dice);
  }

  getWinningAmbushDie(hassleKey) {
    const dice = document.getElementById(`additional-hassle-${hassleKey}-results`).childNodes;
    return this.getWinningDie(dice);
  }

  getElfTotal() {
    this.elfTotal = this.getEffortSpent() + parseInt(this.elfRollResult);
  }

  getCurrentHassle() {
    return {
      fists: parseInt(document.getElementById(`hassle-${this.hassleNum}-fist-count`).value),
      difficulty: parseInt(document.getElementById(`hassle-${this.hassleNum}-difficulty`).value),
      toughness: parseInt(document.getElementById(`hassle-${this.hassleNum}-toughness`).value),
    }
  }

  getHassleCount() {
    const container = document.getElementById('hassle-set');
    return container.querySelectorAll('.hassle').length;
  }

  getHassleTotal() {
    const hassle = this.getCurrentHassle();
    this.hassleTotal = hassle.difficulty + parseInt(this.hassleRollResult);
  }

  clearDice() {
    this.elfDiceContainer.innerHTML = '';
    this.hassleDiceContainer.innerHTML = '';
  }

  getRerollIcon() {
    let rerollIcon = document.createElement('i');
    rerollIcon.className = 'fas fa-arrow-right';
    return rerollIcon;
  }

  markRerolled(die) {
    die.classList.add('rerolled');
  }

  getWinningDie(dice) {
    const diceCount = dice ? dice.length : 0;

    if (diceCount === 0) {
      return 0;
    }

    // Find winning die
    let winningValue = null;
    let value;
    const self = this;
    dice.forEach(function (die) {
      if (die.dataset.value === undefined) {
        return;
      }

      if (die.classList.contains('rerolled')) {
        return;
      }

      value = parseInt(die.dataset.value);
      if (winningValue === null) {
        winningValue = value;
        return;
      }

      if (self.getRatherLose()) {
        if (winningValue > value) {
          winningValue = value;
        }
      } else if (winningValue < value) {
        winningValue = value;
      }
    });

    // Mark winning die
    let winningDieReached = false;
    dice.forEach(function (die) {
      if (die.classList.contains('rerolled')) {
        return;
      }

      value = parseInt(die.dataset.value);
      if (value === winningValue) {
        if (!winningDieReached) {
          winningDieReached = true;
          die.classList.add('winner');
        }
      }
    });

    return winningValue;
  }

  displayMessage() {
    $('#modal').modal();
  }

  showSingleHassleResults() {
    this.setRoundEndMessage();
    this.displayMessage();
  }

  setRoundEndMessage() {
    console.log('setRoundEndMessage');
    const elfRollResults = document.getElementById('elf-roll-results');
    const hassleRollResults = document.getElementById('hassle-roll-results');
    const rollSummary = document.getElementById('roll-summary');
    const hassleName = this.getHassleName(this.hassleNum);
    elfRollResults.innerHTML = `Elf total: ${this.elfTotal}`;
    hassleRollResults.innerHTML = `Hassle total: ${this.hassleTotal}`;
    const defeatedHassle = this.getToughness() === 1 && this.roundConclusion.reduceToughness;

    if (defeatedHassle) {
      rollSummary.innerHTML = `<span class="text-success">You've defeated ${hassleName}</span>`;
      if (this.getHassleCount() === 1) {
        this.setModalResetMode(true);
      }
    } else {
      let win = this.elfTotal > this.hassleTotal;
      rollSummary.innerHTML = (
        win ?
          `<span class="text-success">You win against against ${hassleName}!</span>` :
          `<span class="text-danger">You lose against ${hassleName} this round and suffer any resulting consequences.</span>`
      );
      if (win) {
        rollSummary.innerHTML += `<br />The toughness of ${hassleName} has been reduced to ${this.getToughness() - 1}`;
      }
    }
  }

  showMultipleHassleResults() {
    this.setRoundEndMessage();
    const hassleCount = this.getHassleCount();
    const rollSummary = document.getElementById('roll-summary');
    const toughnessReducedToZero = this.getToughness() === 1 && this.roundConclusion.reduceToughness;
    if (toughnessReducedToZero) {
      if (hassleCount > 1) {
        let moreHassles = hassleCount - 1;
        rollSummary.innerHTML += `<br />${moreHassles} more ${moreHassles === 1 ? 'hassle is' : 'hassles are'} left.`;
      } else {
        this.setModalResetMode(true);
        rollSummary.innerHTML += '<br /><span class="text-success">No hassles remain.</span>'
      }
    }
    this.displayMessage();
  }

  reduceToughness() {
    const toughness = this.getToughness();
    this.setToughness(toughness - 1);
  }

  handleMultipleHassleWin() {
    this.roundConclusion.reduceToughness = true;
    this.showMultipleHassleResults();
    if (this.getToughness() > 1) {
      this.roundConclusion.advanceRound = true;
    } else {
      if (this.getHassleCount() > 1) {
        this.roundConclusion.removeHassle = true;
        this.hassleNum++;
      } else {
        this.roundConclusion.hideSubmitButton = true;
      }
    }
  }

  handleMultipleHassleLoss() {
    this.roundConclusion.advanceRound = true;
    this.showMultipleHassleResults();
    if (this.getHassleCount() > 1) {
      this.handleAmbushes();
    }
  }

  handleSingleHassleLoss() {
    this.roundConclusion.advanceRound = true;
    this.showSingleHassleResults();
  }

  handleSingleHassleWin() {
    this.roundConclusion.reduceToughness = true;
    this.showSingleHassleResults();
    if (this.getToughness() === 1) {
      this.roundConclusion.hideSubmitButton = true;
    } else {
      this.roundConclusion.advanceRound = true;
    }
  }

  advanceRound() {
    this.round++;
    this.updateRoundDisplay();
  }

  resetRound() {
    this.round = 1;
    this.updateRoundDisplay();
  }

  updateRoundDisplay() {
    document.getElementById('round-header').innerHTML = `Round ${this.round}`;
    document.getElementById('modal-round').innerHTML = `Round ${this.round}`;
  }

  showFormResetButton() {
    document.querySelector('#form button.reset-btn').style.display = 'inline';
  }

  hideSubmitButton() {
    document.getElementById('submit').style.display = 'none';
  }

  resetInputs() {
    this.addHassle(this.hassleNum);

    // Reset inputs
    document.getElementById(`hassle-${this.hassleNum}-fist-count`).value = 0;
    document.getElementById(`hassle-${this.hassleNum}-difficulty`).value = 1;
    const hassleName = document.getElementById(`hassle-${this.hassleNum}-name`);
    hassleName.value = '';
    hassleName.placeholder = `Hassle #${this.hassleNum}`;
    this.setEffortSpent(0);
    this.setToughness(1);
    this.setIsMultipleHassle(false);
    document.getElementById('remove-hassle').style.display = 'none';

    // Remove hassles
    const hasslesToRemove = document.querySelectorAll('#hassle-set .hassle:not(:first-child)');
    Array.from(hasslesToRemove).forEach(function (hassle) {
      hassle.remove()
    });

    this.updateEffortSpendingAdvice();

    // Focus on effort input
    this.getEffortSpentField().focus();
  }

  handleReset() {
    const submitButton = document.getElementById('submit');
    const getConfirmation = submitButton.style.display !== 'none' && !this.roundConclusion.hideSubmitButton;
    if (getConfirmation && !confirm('Really reset? This hassle hasn\'t been resolved yet.')) {
      return;
    }
    this.round = 1;
    this.updateRoundDisplay();
    this.clearDice();
    this.resetInputs();
    this.setModalResetMode(false);
    this.advanceHassleNum();
    submitButton.style.display = 'inline';
    document.querySelector('#form button.reset-btn').style.display = 'none';

    this.roundConclusion.hideSubmitButton = false;
    this.roundConclusion.reduceToughness = false;
  }

  advanceRoundOnModalClose() {
    let self = this;
    $('#modal').one('hidden.bs.modal', function () {
      self.advanceRound();
    });
  }

  getEffortSpent() {
    return parseInt(this.getEffortSpentField().value);
  }

  setEffortSpent(value) {
    this.getEffortSpentField().value = value;
    document.getElementById('effort-spent-selected').innerText = value;
  }

  getElfFists() {
    return parseInt(document.getElementById('elf-fist-count').value);
  }

  getRatherLose() {
    return !document.getElementById('rather-win').checked;
  }

  getToughness() {
    return parseInt(document.getElementById(`hassle-${this.hassleNum}-toughness`).value);
  }

  setToughness(value) {
    document.getElementById(`hassle-${this.hassleNum}-toughness`).value = value;
  }

  getIsMultipleHassle() {
    return this.getMultipleHassleField().checked;
  }

  setIsMultipleHassle(value) {
    const checkbox = this.getMultipleHassleField();
    checkbox.checked = value;
    this.handleToggleMultiple(checkbox);
  }

  getMultipleHassleField() {
    return document.getElementById('multiple-hassle');
  }

  /**
   * Manages the result of clicking on 'add hassle' when one or more hassles are already on the screen
   *
   * @param hassleKey
   */
  handleAddHassle(hassleKey) {
    this.addHassle(hassleKey);
    document.getElementById('remove-hassle').style.display = 'inline-block';
  }

  /**
   * Inserts a hassle into the queue. Also used in resetting hassle inputs
   */
  addHassle(hassleKey) {
    const lastHassle = document.querySelector('#hassle-set > .hassle:last-child');
    const hassleContainer = document.getElementById('hassle-set');
    const newHassle = lastHassle.cloneNode(true);
    const difficulty = newHassle.querySelector('.hassle-difficulty');
    const fists = newHassle.querySelector('.hassle-fists');
    const toughness = newHassle.querySelector('.hassle-toughness');
    const name = newHassle.querySelector('.hassle-name');
    newHassle.dataset.hassleKey = hassleKey;
    //const hassleKey = newHassle.dataset.hassleKey;
    difficulty.id = `hassle-${hassleKey}-difficulty`;
    fists.id = `hassle-${hassleKey}-fist-count`;
    toughness.id = `hassle-${hassleKey}-toughness`;
    name.id = `hassle-${hassleKey}-name`;
    name.placeholder = `Hassle #${hassleKey}`;
    hassleContainer.appendChild(newHassle);
  }

  handleToggleMultiple(checkbox) {
    const hassleSection = document.getElementById('hassle-section');
    if (checkbox.checked) {
     hassleSection.classList.add('is-multiple');
    } else {
      hassleSection.classList.remove('is-multiple');
    }
  }

  /**
   * @param selector Either first or last
   */
  removeHassle(selector) {
    const container = document.getElementById('hassle-set');
    const firstHassle = container.querySelector(`.hassle:${selector}-child`);
    firstHassle.parentNode.removeChild(firstHassle);

    // If a multiple hassle is reduced from > 1 hassles to 1 hassle, it becomes a non-multiple hassle
    if (selector === 'first' && this.getHassleCount() === 1 && this.getIsMultipleHassle()) {
      this.setIsMultipleHassle(false);
    }

    if (this.getHassleCount() === 1) {
      const removeButton = document.getElementById('remove-hassle');
      removeButton.style.display = 'none';
    }
  }

  setModalResetMode(isInResetMode) {
    const resetBtn = document.querySelector('#modal button.reset-btn');
    const closeBtn = document.getElementById('modal-close');
    resetBtn.style.display = isInResetMode ? 'inline-block' : 'none';
    closeBtn.style.display = isInResetMode ? 'none' : 'inline-block';
  }

  handleAmbushes() {
    const modalBody = document.getElementById('modal-body');
    const otherHassles = document.querySelectorAll('#hassle-set > .hassle:not(:first-child)');
    const self = this;
    let difficulty;
    let fists;
    let hassleName;
    let otherHassleKey;
    let otherHassleTotal;
    let rollResults;
    let summary;
    let win;
    const canReroll = this.canReroll();
    otherHassles.forEach(function (hassle) {
      // Create containers
      otherHassleKey = hassle.dataset.hassleKey;
      rollResults = document.createElement('div');
      rollResults.id = `additional-hassle-${otherHassleKey}-results`;
      rollResults.classList.add('dice-container');
      if (canReroll) {
        rollResults.classList.add('can-reroll');
      }
      modalBody.appendChild(rollResults);
      summary = document.createElement('div');
      summary.id = `additional-hassle-${otherHassleKey}-summary`;
      summary.className = 'roll-summary'
      modalBody.appendChild(summary);

      // Roll dice and add them and the total score to the modal
      fists = document.getElementById(`hassle-${otherHassleKey}-fist-count`).value;
      self.rollHassleDice(fists, rollResults);
      difficulty = document.getElementById(`hassle-${otherHassleKey}-difficulty`).value;
      otherHassleTotal = parseInt(difficulty) + parseInt(self.getWinningAmbushDie(otherHassleKey));
      rollResults.innerHTML += `<div>Hassle total: ${otherHassleTotal}</div>`;

      // Add summary message to the modal
      win = self.elfTotal > otherHassleTotal;
      hassleName = self.getHassleName(otherHassleKey);
      summary.innerHTML = win ?
        `<span class="text-success">${hassleName} tries to attack you and fails.</span>` :
        `<span class="text-danger">${hassleName} successfully attacks you!</span>`;
    });

    // Remove the extra elements upon modal close
    $('#modal').one('hidden.bs.modal', function () {
      otherHassles.forEach(function (hassle) {
        const otherHassleKey = hassle.dataset.hassleKey;
        document.getElementById(`additional-hassle-${otherHassleKey}-summary`).remove();
        document.getElementById(`additional-hassle-${otherHassleKey}-results`).remove();
      });
    });
  }

  getHassleName(hassleKey) {
    const field = document.getElementById(`hassle-${hassleKey}-name`)
    if (field.value === '') {
      return `Hassle #${hassleKey}`;
    }

    return field.value;
  }

  updateMaxSpendableEffort() {
    const totalElan = this.getTotalElanField().value;
    const totalEffort = this.getTotalEffortField().value;
    const lowest = Math.min(parseInt(totalElan), parseInt(totalEffort));
    const effortSpent = this.getEffortSpentField();
    document.getElementById('effort-spendable-max').innerText = '' + lowest;
    effortSpent.max = lowest;
  }

  deductEffort() {
    const effortSpent = this.getEffortSpent();
    const totalEffortField = this.getTotalEffortField();
    totalEffortField.value = Math.max((totalEffortField.value - effortSpent), 0);
    this.updateMaxSpendableEffort();
  }

  getEffortSpentField() {
    return document.getElementById('effort-spent');
  }

  getTotalEffortField() {
    return document.getElementById('total-effort');
  }

  getTotalElanField() {
    return document.getElementById('total-elan');
  }

  advanceHassleNum() {
    this.hassleNum++;
    const hassle = document.querySelector('#hassle-set > .hassle:first-child');
    hassle.dataset.hassleKey = this.hassleNum;
    const difficulty = hassle.querySelector('.hassle-difficulty');
    const fists = hassle.querySelector('.hassle-fists');
    const toughness = hassle.querySelector('.hassle-toughness');
    const name = hassle.querySelector('.hassle-name');
    difficulty.id = `hassle-${this.hassleNum}-difficulty`;
    fists.id = `hassle-${this.hassleNum}-fist-count`;
    toughness.id = `hassle-${this.hassleNum}-toughness`;
    name.id = `hassle-${this.hassleNum}-name`;
    name.placeholder = `Hassle #${this.hassleNum}`;
  }

  updateEffortSpendingAdvice() {
    const possibleSuccess = document.getElementById('effort-for-possible-success');
    const guaranteedSuccess = document.getElementById('effort-to-guarantee-success');
    const hassle = this.getCurrentHassle();
    const minHassleTotal = hassle.difficulty + (hassle.fists === 0 ? 0 : 1);
    const maxHassleTotal = hassle.difficulty + (hassle.fists === 0 ? 0 : 6);
    const minElfRoll = 1;
    const maxElfRoll = 6;
    const minEffortForPossibleSuccess = Math.max(minHassleTotal - maxElfRoll + 1, 0);
    const minEffortForGuaranteedSuccess = Math.max(maxHassleTotal - minElfRoll + 1, 0);

    possibleSuccess.innerText = '' + minEffortForPossibleSuccess;
    guaranteedSuccess.innerText = '' + minEffortForGuaranteedSuccess;
  }

  isUsingCat() {
    const catField = document.getElementById('familiar-cat');

    return catField.checked;
  }

  getElfAutoRerollTargets() {
    const values = [];
    if (!this.isUsingCat() && this.getIsMultipleHassle()) {
      values.push('4', '5', '6');
    }

    const selectedDice = document.querySelectorAll('#elf-reroll-options i[data-selected="1"]');
    selectedDice.forEach(function (die) {
      const value = die.dataset.value;
      if (values.indexOf(value) === -1) {
        values.push(value);
      }
    });

    return values;
  }

  getHassleAutoRerollTargets() {
    const values = [];
    const selectedDice = document.querySelectorAll('#hassle-reroll-options i[data-selected="1"]');
    selectedDice.forEach(function (die) {
      const value = die.dataset.value;
      if (values.indexOf(value) === -1) {
        values.push(value);
      }
    });

    return values;
  }

  prepareModal() {
    const modal = $('#modal');
    const self = this;
    modal.on('hidden.bs.modal', function () {
      const submit = document.getElementById('submit');
      const reset = document.querySelector('#form button.reset-btn');
      if (submit.style.display !== 'none') {
        submit.focus();
      } else {
        reset.focus();
      }
      self.concludeRound();
      self.setEffortSpent(0);
    });
    modal.on('shown.bs.modal', function () {
      document.getElementById('modal-close').focus();
    });
  }

  prepareResetButtons() {
    const resetButtons = document.querySelectorAll('button.reset-btn');
    const self = this;
    resetButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        self.handleReset();
      });
    });
  }

  prepareAddHassleButton() {
    const addHassleButton = document.getElementById('add-hassle');
    const self = this;
    addHassleButton.addEventListener('click', function () {
      const lastHassle = document.querySelector('#hassle-set > .hassle:last-child');
      const hassleKey = lastHassle.dataset.hassleKey;
      self.handleAddHassle(parseInt(hassleKey) + 1);
    });
  }

  prepareEffortInputs() {
    const self = this;
    const totalElan = this.getTotalElanField();
    totalElan.addEventListener('change', function () {
      self.updateMaxSpendableEffort();
    });
    const totalEffort = this.getTotalEffortField();
    totalEffort.addEventListener('change', function () {
      self.updateMaxSpendableEffort();
    });
    this.updateMaxSpendableEffort();

    const effortSpentField = this.getEffortSpentField();
    effortSpentField.addEventListener('input', function () {
      const effortSelection = document.getElementById('effort-spent-selected');
      effortSelection.innerText = effortSpentField.value;
    });
  }

  prepareFooter() {
    const algorithmButton = document.getElementById('algorithm-button');
    algorithmButton.addEventListener('click', function () {
      $('#algorithm-popup').modal();
    });
  }

  prepareEffortSpendingAdvice() {
    const self = this;
    const hassleRollModifiers = document.querySelectorAll('.hassle-difficulty, .hassle-fists');
    hassleRollModifiers.forEach(function (input) {
      input.addEventListener('change', function () {
        self.updateEffortSpendingAdvice();
      })
    });
  }

  prepareFormSubmit() {
    const self = this;
    const form = document.getElementById('form');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      self.handleFormSubmit();
    });
  }

  prepareMultiHassleCheckbox() {
    const self = this;
    const multipleHassleCheckbox = this.getMultipleHassleField();
    multipleHassleCheckbox.addEventListener('change', function () {
      self.handleToggleMultiple(this);
    });
  }

  prepareRemoveHassleButton() {
    const self = this;
    const removeButton = document.getElementById('remove-hassle');
    removeButton.addEventListener('click', function (event) {
      event.preventDefault();
      self.removeHassle('last');
    });
  }

  canReroll() {
    return document.getElementById('can-reroll').checked;
  }

  handleCanRerollToggle() {
    const diceContainers = document.querySelectorAll('.dice-container');
    const canReroll = this.canReroll();
    diceContainers.forEach(function (container) {
      if (canReroll) {
        container.classList.add('can-reroll');
      } else {
        container.classList.remove('can-reroll');
      }
    });
  }

  prepareCanRerollToggler() {
    const toggler = document.getElementById('can-reroll');
    const self = this;
    toggler.addEventListener('change', function () {
      self.handleCanRerollToggle();
    });
  }

  addRerollHandler(die) {
    const self = this;
    die.addEventListener('click', function () {
      const isRerolled = die.classList.contains('rerolled');
      const canReroll = self.canReroll();
      if (!canReroll || isRerolled) {
        return;
      }
      self.handleReroll(die);
    })
  }

  handleReroll(die) {
    this.resetConcludeRoundFlags();
    this.setModalResetMode(false);
    const rerollIcon = this.getRerollIcon();
    die.after(rerollIcon);
    const newDie = this.getRandomDie();
    rerollIcon.after(newDie);
    this.markRerolled(die);
    const dice = die.parentNode.childNodes;
    dice.forEach(function (siblingDie) {
      siblingDie.classList.remove('winner');
    });
    this.getWinningElfDie();
    this.getWinningHassleDie();
    this.handleRollResults();
  }

  concludeRound() {
    if (this.roundConclusion.reduceToughness) {
      this.reduceToughness();
    }
    if (this.roundConclusion.removeHassle) {
      this.removeHassle('first');
    }
    if (this.roundConclusion.hideSubmitButton) {
      this.hideSubmitButton();
    }
    if (this.roundConclusion.advanceRound) {
      this.advanceRound();
    }

    this.resetConcludeRoundFlags();
  }

  resetConcludeRoundFlags() {
    this.roundConclusion = {
      advanceRound: false,
      hideSubmitButton: false,
      reduceToughness: false,
      removeHassle: false,
    };
  }
}
