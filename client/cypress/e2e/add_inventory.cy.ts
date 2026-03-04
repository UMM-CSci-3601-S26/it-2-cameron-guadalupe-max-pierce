import { InventoryItem } from 'src/app/inventory/inventory_item';
import { AddItemPage } from '../support/add_inventory.po';

describe('Add item', () => {
  const page = new AddItemPage();

  beforeEach(() => {
    page.navigateTo();
  });

  it('Should have the correct title', () => {
    page.getTitle().should('have.text', 'New Item');
  });

  it('Should enable and disable the add user button', () => {
    // ADD USER button should be disabled until all the necessary fields
    // are filled. Once the last (`#emailField`) is filled, then the button should
    // become enabled.
    page.addItemButton().should('be.disabled');
    page.getFormField('name').type('Test Item');
    page.addItemButton().should('be.disabled');
    page.getFormField('stocked').type('10');
    page.addItemButton().should('be.disabled');
    page.getFormField('type').type('pencil');
    page.addItemButton().should('be.disabled');
    page.getFormField('location').type('tote #9');
    page.addItemButton().should('be.disabled');
    page.getFormField('desc').type('Yellow Pencils Pack of 12');
    page.addItemButton().should('be.enabled');
  });

  it('Should show error messages for invalid inputs', () => {
    // Before doing anything there shouldn't be an error
    cy.get('[data-test=nameError]').should('not.exist');
    // Just clicking the name field without entering anything should cause an error message
    page.getFormField('name').click().blur();
    cy.get('[data-test=nameError]').should('exist').and('be.visible');
    // Some more tests for various invalid name inputs
    page.getFormField('name').type('J').blur();
    cy.get('[data-test=nameError]').should('exist').and('be.visible');
    page
      .getFormField('name')
      .clear()
      .type('This is a very long name that goes beyond the 50 character limit')
      .blur();
    cy.get('[data-test=nameError]').should('exist').and('be.visible');
    // Entering a valid name should remove the error.
    page.getFormField('name').clear().type('Valid Item Name').blur();
    cy.get('[data-test=nameError]').should('not.exist');

    // Before doing anything there shouldn't be an error
    cy.get('[data-test=stockedError]').should('not.exist');
    // Just clicking the age field without entering anything should cause an error message
    page.getFormField('stocked').click().blur();
    // Some more tests for various invalid age inputs
    cy.get('[data-test=stockedError]').should('exist').and('be.visible');
    page.getFormField('stocked').type('-5').blur();
    cy.get('[data-test=stockedError]').should('exist').and('be.visible');
    page.getFormField('stocked').clear().type('5000').blur();
    cy.get('[data-test=stockedError]').should('exist').and('be.visible');
    page.getFormField('stocked').clear().type('abc').blur();
    cy.get('[data-test=stockedError]').should('exist').and('be.visible');
    // Entering a valid age should remove the error.
    page.getFormField('stocked').clear().type('25').blur();
    cy.get('[data-test=stockedError]').should('not.exist');

  });

  describe('Adding a new user', () => {
    beforeEach(() => {
      cy.task('seed:database');
    });

    it('Should go to the right page, and have the right info', () => {
      const item: InventoryItem = {
        _id: null,
        name: 'Blue Pen 10-Pack',
        type: 'pen',
        desc: 'Blue ink, pack of 10',
        location: 'Tote #9',
        stocked: 25,
      };

      // The `page.addUser(user)` call ends with clicking the "Add User"
      // button on the interface. That then leads to the client sending an
      // HTTP request to the server, which has to process that request
      // (including making calls to add the user to the database and wait
      // for those to respond) before we get a response and can update the GUI.
      // By calling `cy.intercept()` we're saying we want Cypress to "notice"
      // when we go to `/api/users`. The `AddUserComponent.submitForm()` method
      // routes to `/api/users/{MongoDB-ID}` if the REST request to add the user
      // succeeds, and that routing will get "noticed" by the Cypress because
      // of the `cy.intercept()` call.
      //
      // The `.as('addUser')` call basically gives that event a name (`addUser`)
      // which we can use in things like `cy.wait()` to say which event or events
      // we want to wait for.
      //
      // The `cy.wait('@addUser')` tells Cypress to wait until we have successfully
      // routed to `/api/users` before we continue with the following checks. This
      // hopefully ensures that the server (and database) have completed all their
      // work, and that we should have a properly formed page on the client end
      // to check.
      cy.intercept('POST', '/api/inventory').as('addItem');
      page.addItem(item);
      cy.wait('@addItem');

      // New URL should end in the 24 hex character Mongo ID of the newly added user.
      // We'll wait up to five full minutes for this these `should()` assertions to succeed.
      // Hopefully that long timeout will help ensure that our Cypress tests pass in
      // GitHub Actions, where we're often running on slow VMs.
      cy.url({ timeout: 300000 })
        .should('match', /\/inventory\/[0-9a-fA-F]{24}$/)
        .should('not.match', /\/inventory\/new$/);

      // The new user should have all the same attributes as we entered
      cy.get('.user-card-name').should('have.text', item.name);
      cy.get('.user-card-type').should('have.text', item.type);
      cy.get('.user-card-desc').should('have.text', item.desc);
      cy.get('.user-card-location').should('have.text', item.location);
      cy.get('.user-card-stocked').should('have.text', item.stocked.toString());

      // We should see the confirmation message at the bottom of the screen
      page.getSnackBar().should('contain', `Added item ${item.name}`);
    });

    it('Should fail with no company', () => {
      const item: InventoryItem = {
        _id: null,
        name: 'Bad Item',
        type: 'pen',
        location: null, // The company being set to null means nothing will be typed for it
        desc: 'missing location',
        stocked: 10,
      };

      // Here we're _not_ expecting to route to `/api/users` since adding this
      // user should fail. So we don't add `cy.intercept()` and `cy.wait()` calls
      // around this `page.addUser(user)` call. If we _did_ add them, the test wouldn't
      // actually fail because a `cy.wait()` that times out isn't considered a failure,
      // although we could catch the timeout and turn it into a failure if we needed to.
      page.addItem(item);

      // We should get an error message
      page.getSnackBar().should('contain', 'Tried to add an illegal new item');

      // We should have stayed on the new user page
      cy.url()
        .should('not.match', /\/inventory\/[0-9a-fA-F]{24}$/)
        .should('match', /\/inventory\/new$/);

      // The things we entered in the form should still be there
      page.getFormField('name').should('have.value', item.name);
      page.getFormField('type').should('have.value', item.type);
      page.getFormField('desc').should('have.value', item.desc);
      page.getFormField('stocked').should('have.value', item.stocked.toString());
    });
  });
});
