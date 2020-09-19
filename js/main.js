class HassleResolver {
  constructor() {
    this.round = 1;
    this.hassleNum = 1;
    const form = document.getElementById('form');
    const self = this;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      self.handleFormSubmit();
    });

    const multipleHassleCheckbox = this.getMultipleHassleField();
    multipleHassleCheckbox.addEventListener('change', function () {
      self.handleToggleMultiple(this);
    });

    document.querySelectorAll('button.reset-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        self.handleReset();
      });
    });

    const modal = $('#modal');
    modal.on('hidden.bs.modal', function () {
      self.setEffortSpent(0);
    });
    modal.on('shown.bs.modal', function () {
      document.getElementById('modal-close').focus();
    });
    document.getElementById('modal-close').addEventListener('click', function () {
      const submit = document.getElementById('submit');
      const reset = document.querySelector('#form button.reset-btn');
      if (submit.style.display !== 'none') {
        submit.focus();
      } else {
        reset.focus();
      }
    });

    document.getElementById('add-hassle').addEventListener('click', function () {
      const lastHassle = document.querySelector('#hassle-set > .hassle:last-child');
      const hassleKey = lastHassle.dataset.hassleKey;
      self.handleAddHassle(parseInt(hassleKey) + 1);
    })

    this.elfDiceContainer = document.getElementById('elf-dice-container');
    this.hassleDiceContainer = document.getElementById('hassle-dice-container');
    const effortSpentField = this.getEffortSpentField();
    effortSpentField.addEventListener('input', function () {
      const effortSelection = document.getElementById('effort-spent-selected');
      effortSelection.innerText = effortSpentField.value;
    });
    effortSpentField.focus();

    const removeButton = document.getElementById('remove-hassle');
    removeButton.addEventListener('click', function (event) {
      event.preventDefault();
      self.removeHassle('last');
    });

    const totalElan = this.getTotalElanField();
    totalElan.addEventListener('change', function () {
      self.updateMaxSpendableEffort();
    });
    const totalEffort = this.getTotalEffortField();
    totalEffort.addEventListener('change', function () {
      self.updateMaxSpendableEffort();
    });
    this.updateMaxSpendableEffort();

    const algorithmButton = document.getElementById('algorithm-button');
    algorithmButton.addEventListener('click', function () {
      $('#algorithm-popup').modal();
    });

    const hassleRollModifiers = document.querySelectorAll('.hassle-difficulty, .hassle-fists');
    hassleRollModifiers.forEach(function (input) {
      input.addEventListener('change', function () {
        self.updateEffortSpendingAdvice();
      })
    });

    this.updateEffortSpendingAdvice();

    this.prepareAutoRerollSelectors();
  }

  prepareAutoRerollSelectors() {
    ['elf', 'hassle'].forEach(function (section) {
      const checkbox = document.getElementById(`${section}-auto-reroll`);
      const diceContainer = document.getElementById(`${section}-reroll-options`);
      checkbox.addEventListener('change', function (event) {
        diceContainer.style.display = event.target.checked ? 'block' : 'none';
      });
      const dice = diceContainer.querySelectorAll('i');
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
    this.getElfTotal();
    this.rollHassleDice(this.getCurrentHassle().fists, this.hassleDiceContainer);
    this.getHassleTotal();
    if (this.elfTotal > this.hassleTotal) {
      if (this.getIsMultipleHassle()) {
        this.handleMultipleHassleWin();
      } else {
        this.handleSingleHassleWin();
      }
    } else {
      if (this.getIsMultipleHassle()) {
        this.handleMultipleHassleLoss();
      } else {
        this.handleSingleHassleLoss();
      }
    }
    this.showFormResetButton();
  }

  validate() {
    return true;
  }

  rollElfDice() {
    let die;
    const isUsingCat = this.isUsingCat();
    for (let n = 0; n < this.getElfFists(); n++) {
      die = this.getRandomDie();
      this.elfDiceContainer.appendChild(die);
      if (!isUsingCat && this.getIsMultipleHassle() && die.dataset.value >= 4) {
        this.markRerolled(die);
        this.elfDiceContainer.appendChild(this.getRerollIcon());
        this.elfDiceContainer.appendChild(this.getRandomDie());
      }
    }
    this.getWinningElfDie();

    if (isUsingCat) {
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
    const key = Math.floor(Math.random() * 5);
    const number = numbers[key];
    const numberWord = number[0];
    const numberDigit = number[1];
    const die = document.createElement('i');
    die.className = `fas fa-dice-${numberWord}`;
    die.setAttribute('data-value', numberDigit);
    return die;
  }

  rollHassleDice(fists, container) {
    let die;
    for (let n = 0; n < fists; n++) {
      die = this.getRandomDie();
      container.appendChild(die);
    }
    this.getWinningHassleDie();
  }

  getWinningElfDie() {
    const dice = document.getElementById('elf-dice-container').childNodes;
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
    die.className += ' rerolled';
    die.dataset.rerolled = '1';
  }

  getWinningDie(dice) {
    const diceCount = dice ? dice.length : 0;

    if (diceCount === 0) {
      return 0;
    }

    // Find winning die
    let winningValue = null;
    let die, value;
    for (let n = 0; n < diceCount; n++) {
      die = dice[n];
      if (die.dataset.value === undefined) {
        continue;
      }

      if (die.dataset.rerolled) {
        continue;
      }
      value = parseInt(die.dataset.value);
      if (winningValue === null) {
        winningValue = value;
        continue;
      }

      if (this.getRatherLose()) {
        if (winningValue > value) {
          winningValue = value;
        }
      } else if (winningValue < value) {
        winningValue = value;
      }
    }

    // Mark winning die
    let winningDieReached = false;
    for (let n = 0; n < diceCount; n++) {
      die = dice[n];
      if (die.dataset.rerolled) {
        continue;
      }
      value = parseInt(die.dataset.value);
      if (value === winningValue) {
        if (!winningDieReached) {
          winningDieReached = true;
          die.className += ' winner';
        }
      }
    }

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
    const elfRollResults = document.getElementById('elf-roll-results');
    const hassleRollResults = document.getElementById('hassle-roll-results');
    const rollSummary = document.getElementById('roll-summary');
    let win = this.elfTotal > this.hassleTotal;
    const hassleName = this.getHassleName(this.hassleNum);
    elfRollResults.innerHTML = `Elf total: ${this.elfTotal}`;
    hassleRollResults.innerHTML = `Hassle total: ${this.hassleTotal}`;
    if (this.getToughness() > 0) {
      rollSummary.innerHTML = (
        win ?
          `<span class="text-success">You win against against ${hassleName}!</span>` :
          `<span class="text-danger">You lose against ${hassleName} this round and suffer any resulting consequences.</span>`
      );
      if (win) {
        rollSummary.innerHTML += `<br />The toughness of ${hassleName} has been reduced to ${this.getToughness()}`;
      }
    } else {
      rollSummary.innerHTML = `<span class="text-success">You've defeated ${hassleName}</span>`;
      if (this.getHassleCount() === 1) {
        this.setModalResetMode(true);
      }
    }
  }

  showMultipleHassleResults() {
    this.setRoundEndMessage();
    const hassleCount = this.getHassleCount();
    const rollSummary = document.getElementById('roll-summary');
    if (this.getToughness() === 0) {
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
    this.reduceToughness();
    this.showMultipleHassleResults();
    if (this.getToughness() > 0) {
      this.advanceRoundOnModalClose();
    } else {
      if (this.getHassleCount() > 1) {
        this.removeHassle('first');
        this.hassleNum++;
      } else {
        this.hideSubmitButton();
      }
    }
  }

  handleMultipleHassleLoss() {
    this.advanceRoundOnModalClose();
    this.showMultipleHassleResults();
    if (this.getHassleCount() > 1) {
      this.handleAmbushes();
    }
  }

  handleSingleHassleLoss() {
    this.advanceRoundOnModalClose();
    this.showSingleHassleResults();
  }

  handleSingleHassleWin() {
    this.reduceToughness();
    this.showSingleHassleResults();
    this.advanceRoundOnModalClose();
    if (this.getToughness() === 0) {
      this.hideSubmitButton();
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
    if (submitButton.style.display !== 'none' && !confirm('Really reset? This hassle hasn\'t been resolved yet.')) {
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
  }

  advanceRoundOnModalClose() {
    let self = this;
    // Wait to advance the round until after the modal is closed
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
    otherHassles.forEach(function (hassle) {
      // Create containers
      otherHassleKey = hassle.dataset.hassleKey;
      rollResults = document.createElement('div');
      rollResults.id = `additional-hassle-${otherHassleKey}-results`;
      rollResults.className = 'dice-container';
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
}
