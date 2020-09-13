class HassleResolver {
  constructor() {
    this.round = 1;
    this.hassleNum = 0;
    const form = document.getElementById('form');
    const self = this;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      self.handleFormSubmit();
    });

    const multipleHassleCheckbox = document.getElementById('multiple-hassle');
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
      self.setEffort(0);
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
      self.handleAddHassle(hassleKey + 1);
    })

    this.elfDiceContainer = document.getElementById('elf-dice-container');
    this.hassleDiceContainer = document.getElementById('hassle-dice-container');
    document.getElementById('effort-spent').focus();

    const removeButton = document.getElementById('remove-hassle');
    removeButton.addEventListener('click', function (event) {
      event.preventDefault();
      self.removeHassle('last');
      if (self.getHassleCount() === 1) {
        removeButton.style.display = 'none';
      }
    });
  }

  handleFormSubmit() {
    this.clearDice();
    if (!this.validate()) {
      return;
    }
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
    for (let n = 0; n < this.getElfFists(); n++) {
      die = this.getRandomDie();
      this.elfDiceContainer.appendChild(die);
      if (this.getIsMultipleHassle() && die.dataset.value >= 4) {
        this.markRerolled(die);
        this.elfDiceContainer.appendChild(this.getRerollIcon());
        this.elfDiceContainer.appendChild(this.getRandomDie());
      }
    }
    this.getWinningElfDie();
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
    die.className = 'fas fa-dice-' + numberWord;
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

  getElfTotal() {
    this.elfTotal = this.getEffort() + parseInt(this.elfRollResult);
  }

  getCurrentHassle() {
    return {
      fists: parseInt(document.getElementById('hassle-' + this.hassleNum + '-fist-count').value),
      difficulty: parseInt(document.getElementById('hassle-' + this.hassleNum + '-difficulty').value),
      toughness: parseInt(document.getElementById('hassle-' + this.hassleNum + '-toughness').value),
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
    this.setRoundWinMessage();
    this.displayMessage();
  }

  setRoundWinMessage() {
    const elfRollResults = document.getElementById('elf-roll-results');
    const hassleRollResults = document.getElementById('hassle-roll-results');
    const rollSummary = document.getElementById('roll-summary');
    let win = this.elfTotal > this.hassleTotal;
    if (this.getToughness() > 0) {
      elfRollResults.innerHTML = `Elf total: ${this.elfTotal}`;
      hassleRollResults.innerHTML = `Hassle total: ${this.hassleTotal}`;
      rollSummary.innerHTML = (
        win ?
          '<span class="text-success">You win!</span>' :
          '<span class="text-danger">You lose and suffer this hassle\'s consequences (if any).</span>'
      );
      if (win) {
        rollSummary.innerHTML += '<br />Hassle toughness reduced to ' + this.getToughness();
      }
    } else {
      elfRollResults.innerHTML = `Elf total: ${this.elfTotal}`;
      hassleRollResults.innerHTML = `Hassle total: ${this.hassleTotal}`;
      rollSummary.innerHTML = '<span class="text-success">Hassle defeated!</span>';
      if (this.getHassleCount() === 1) {
        this.setModalResetMode(true);
      }
    }
  }

  showMultipleHassleResults() {
    this.setRoundWinMessage();
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
    if (this.getHassleCount() === 1) {
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
    document.getElementById('round-header').innerHTML = 'Round ' + this.round;
    document.getElementById('modal-round').innerHTML = 'Round ' + this.round;
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
    document.getElementById('hassle-' + this.hassleNum +'-fist-count').value = 0;
    document.getElementById('hassle-' + this.hassleNum +'-difficulty').value = 1;
    this.setEffort(0);
    this.setToughness(1);
    this.setIsMultipleHassle(false);

    // Remove hassles
    const hasslesToRemove = document.querySelectorAll('#hassle-set .hassle:not(:first-child)');
    Array.from(hasslesToRemove).forEach(function (hassle) {
      hassle.remove()
    });

    // Focus on effort input
    document.getElementById('effort-spent').focus();
  }

  handleReset() {
    this.round = 1;
    this.updateRoundDisplay();
    this.clearDice();
    this.resetInputs();
    this.setModalResetMode(false);
    document.getElementById('submit').style.display = 'inline';
    document.querySelector('#form button.reset-btn').style.display = 'none';
  }

  advanceRoundOnModalClose() {
    let self = this;
    // Wait to advance the round until after the modal is closed
    $('#modal').one('hidden.bs.modal', function () {
      self.advanceRound();
    });
  }

  getEffort() {
    return parseInt(document.getElementById('effort-spent').value);
  }

  setEffort(value) {
    document.getElementById('effort-spent').value = value;
  }

  getElfFists() {
    return parseInt(document.getElementById('elf-fist-count').value);
  }

  getRatherLose() {
    return !document.getElementById('rather-win').checked;
  }

  getToughness() {
    return parseInt(document.getElementById('hassle-' + this.hassleNum +'-toughness').value);
  }

  setToughness(value) {
    document.getElementById('hassle-' + this.hassleNum +'-toughness').value = value;
  }

  getIsMultipleHassle() {
    return document.getElementById('multiple-hassle').checked;
  }

  setIsMultipleHassle(value) {
    document.getElementById('multiple-hassle').checked = value;
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
  addHassle() {
    const lastHassle = document.querySelector('#hassle-set > .hassle:last-child');
    const hassleContainer = document.getElementById('hassle-set');
    const newHassle = lastHassle.cloneNode(true);
    const difficulty = newHassle.querySelector('.hassle-difficulty');
    const fists = newHassle.querySelector('.hassle-fists');
    const toughness = newHassle.querySelector('.hassle-toughness');
    const name = newHassle.querySelector('.hassle-name');
    newHassle.dataset.hassleKey++;
    difficulty.id = 'hassle-' + newHassle.dataset.hassleKey + '-difficulty';
    fists.id = 'hassle-' + newHassle.dataset.hassleKey + '-fist-count';
    toughness.id = 'hassle-' + newHassle.dataset.hassleKey + '-toughness';
    name.id = 'hassle-' + newHassle.dataset.hassleKey + '-name';
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
    const firstHassle = container.querySelector('.hassle:' + selector + '-child');
    firstHassle.parentNode.removeChild(firstHassle);
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
      otherHassleTotal = parseInt(difficulty) + parseInt(self.hassleRollResult);
      rollResults.innerHTML += `<div>Hassle total: ${otherHassleTotal}</div>`;

      // Add summary message to the modal
      win = self.elfTotal > otherHassleTotal;
      summary.innerHTML = win ?
        '<span class="text-success">The next hassle tries to attack you and fails.</span>' :
        '<span class="text-danger">The next hassle successfully attacks you! You suffer any of its consequences.</span>';
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
}
