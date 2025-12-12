describe('Trail Tracker - smoke test', () => {
  it('loads and toggles basemap buttons', () => {
    cy.visit('/')

    cy.contains('Trail Tracker').should('be.visible')
    cy.contains('Base map:').should('be.visible')

    cy.get('[data-testid="basemap-toggle"]').within(() => {
      // Buttons exist
      cy.get('[data-testid="basemap-nls"]').should('be.visible')
      cy.get('[data-testid="basemap-mapant"]').should('be.visible')

      // Initial state
      cy.get('[data-testid="basemap-nls"]').should('have.class', 'pillButtonActive')
      cy.get('[data-testid="basemap-mapant"]').should('not.have.class', 'pillButtonActive')

      // Toggle to MapAnt
      cy.get('[data-testid="basemap-mapant"]').click()
      cy.get('[data-testid="basemap-mapant"]').should('have.class', 'pillButtonActive')
      cy.get('[data-testid="basemap-nls"]').should('not.have.class', 'pillButtonActive')
    })
  })
})
