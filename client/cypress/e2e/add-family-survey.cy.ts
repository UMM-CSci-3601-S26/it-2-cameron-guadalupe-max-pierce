describe('Backpack Need Survey', () => {
  it('visits survey and submits required data', () => {
    cy.visit('/families/survey');

    cy.get('[name=familyLastName]').type('Smith');
    cy.get('[name=childFirstName]').type('Emma');
    cy.get('[name=school]').type('Lincoln Elementary');
    cy.get('[name=grade]').click();
    cy.get('mat-option').contains('4').click();
    cy.get('mat-radio-button[value="yes"]').click();

    cy.get('form').submit();

    cy.on('window:alert', (str) => {
      expect(str).to.equal('Thank you for submitting!');
    });

    cy.get('[name=familyLastName]').should('have.value', '');
    cy.get('[name=childFirstName]').should('have.value', '');
    cy.get('[name=school]').should('have.value', '');
    cy.get('[name=grade]').should('contain.text', 'Grade');
  });
});
