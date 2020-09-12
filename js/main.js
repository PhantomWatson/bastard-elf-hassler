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

    const resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function (event) {
      self.handleReset();
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
      const reset = document.getElementById('reset');
      if (submit.style.display !== 'none') {
        submit.focus();
      } else {
        reset.focus();
      }
    });

    document.getElementById('add-hassle').addEventListener('click', function () {
      self.handleAddHassle();
    })

    this.elfDiceContainer = document.getElementById('elf-dice-container');
    this.hassleDiceContainer = document.getElementById('hassle-dice-container');
    document.getElementById('effort-spent').focus();

    const removeButton = document.getElementById('remove-hassle');
    removeButton.addEventListener('click', function (event) {
      event.preventDefault();
      const container = document.getElementById('hassle-set');
      const lastHassle = container.querySelector('.hassle:last-child');
      lastHassle.parentNode.removeChild(lastHassle);
      if (self.getHassleCount() === 1) {
        removeButton.style.display = 'none';
      }
    });
  }

  handleFormSubmit() {
    this.clearDice();
    this.readInput();
    if (!this.validate()) {
      return;
    }
    this.rollElfDice();
    this.getElfTotal();
    this.rollHassleDice();
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
    this.showResetButton();
  }

  readInput() {
    this.hassles = [];
    this.hassles.push(
      {
        fists: parseInt(document.getElementById('hassle-' + this.hassleNum + '-fist-count').value),
        difficulty: parseInt(document.getElementById('hassle-' + this.hassleNum + '-difficulty').value)
      }
    );
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

  rollHassleDice(hassleNum) {
    let die;
    for (let n = 0; n < this.hassles[0].fists; n++) {
      die = this.getRandomDie();
      this.hassleDiceContainer.appendChild(die);
      if (this.getIsMultipleHassle()) {
        //
      }
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

  displayMessage(msg) {
    document.getElementById('modal-body').innerHTML = msg;
    $('#modal').modal();
  }

  showSingleHassleResults() {
    let msg = this.getRoundWinMessage();
    this.displayMessage(msg);
  }

  getRoundWinMessage() {
    let msg;
    let win = this.elfTotal > this.hassleTotal;
    if (this.getToughness() > 0) {
      msg = `Elf total: ${this.elfTotal}`;
      msg += `<br \>Hassle total: ${this.hassleTotal}`;
      msg += '<br /><strong>' + (win ? 'You win!' : 'You lose and suffer this hassle\'s consequences (if any).');
      if (win) {
        msg += '<br />Hassle toughness reduced to ' + this.getToughness();
      }
      msg += '</strong>';
    } else {
      msg = `Elf total: ${this.elfTotal}`;
      msg += `<br \>Hassle total: ${this.hassleTotal}`;
      msg += '<br /><strong>Hassle defeated!</strong>';
    }

    return msg;
  }

  showMultipleHassleResults() {
    let msg = this.getRoundWinMessage();
    const hassleCount = this.getHassleCount();
    if (this.getToughness() === 0) {
      if (hassleCount > 1) {
        let moreHassles = hassleCount - 1;
        msg += `<br /><strong>${moreHassles} more ${moreHassles === 1 ? 'hassle' : 'hassles'} are left.</strong>`;
      } else {
        msg += '<br /><strong>No hassles remain.</strong>'
      }
    }
    this.displayMessage(msg);
  }

  reduceToughness() {
    const toughness = this.getToughness();
    this.setToughness(toughness - 1);
  }

  handleMultipleHassleWin() {
    this.reduceToughness();
    if (this.getToughness() > 0) {
      this.advanceRoundOnModalClose();
    } else {
      this.hideSubmitButton();
    }
    this.showMultipleHassleResults();
  }

  handleMultipleHassleLoss() {
    this.advanceRoundOnModalClose();
    this.showMultipleHassleResults();
  }

  handleSingleHassleLoss() {
    this.advanceRoundOnModalClose();
    this.showSingleHassleResults();
  }

  handleSingleHassleWin() {
    this.reduceToughness();
    this.showSingleHassleResults();
    this.advanceRoundOnModalClose();
    this.hideSubmitButton();
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

  showResetButton() {
    document.getElementById('reset').style.display = 'inline';
  }

  hideSubmitButton() {
    document.getElementById('submit').style.display = 'none';
  }

  resetInputs() {
    document.getElementById('hassle-' + this.hassleNum +'-fist-count').value = 0;
    document.getElementById('hassle-' + this.hassleNum +'-difficulty').value = 1;
    document.getElementById('hassle-' + this.hassleNum +'-toughness').value = 1;
    this.hassleNum = 0;
    this.setEffort(0);
    this.setToughness(1);
    this.setIsMultipleHassle(false);
    const hasslesToRemove = document.querySelectorAll('#hassle-set .hassle:not(:first-child)');
    Array.from(hasslesToRemove).forEach(function (hassle) {
      hassle.remove()
    });
    document.getElementById('effort-spent').focus();
  }

  handleReset() {
    this.round = 1;
    this.updateRoundDisplay();
    this.clearDice();
    this.resetInputs();
    document.getElementById('submit').style.display = 'inline';
    document.getElementById('reset').style.display = 'none';
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

  handleAddHassle() {
    const lastHassle = document.querySelector('#hassle-set > .hassle:last-child');
    const hassleContainer = document.getElementById('hassle-set');
    const newHassle = lastHassle.cloneNode(true);
    const difficulty = newHassle.querySelector('.hassle-difficulty');
    const fists = newHassle.querySelector('.hassle-fists');
    const toughness = newHassle.querySelector('.hassle-toughness');
    newHassle.dataset.hassleKey++;
    difficulty.id = 'hassle-' + newHassle.dataset.hassleKey + '-difficulty';
    fists.id = 'hassle-' + newHassle.dataset.hassleKey + '-fist-count';
    toughness.id = 'hassle-' + newHassle.dataset.hassleKey + '-toughness';
    hassleContainer.appendChild(newHassle);
    document.getElementById('remove-hassle').style.display = 'inline-block';
  }

  handleToggleMultiple(checkbox) {
    const hassleSection = document.getElementById('hassle-section');
    if (checkbox.checked) {
      hassleSection.classList.add('is-multiple');
    } else {
      hassleSection.classList.remove('is-multiple');
    }
  }
}
