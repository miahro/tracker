// web/cypress/e2e/editor-controls.cy.ts
//
// Tests the editor header controls driven by useDraftTrack state.
// Map clicks (adding real points) are not tested here — they require
// WebGL. This suite covers the state machine transitions visible in the DOM.

describe('Track editor controls', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  // ---------------------------------------------------------------------------
  // Idle state
  // ---------------------------------------------------------------------------

  it('shows Draw AVO, Draw VOI and Draw Training buttons when idle', () => {
    cy.get('[data-testid="editor-controls"]').within(() => {
      cy.get('[data-testid="btn-draw-avo"]').should('be.visible')
      cy.get('[data-testid="btn-draw-voi"]').should('be.visible')
      cy.get('[data-testid="btn-draw-training"]').should('be.visible')
    })
  })

  it('does not show Undo or Reset when idle', () => {
    cy.get('[data-testid="btn-undo"]').should('not.exist')
    cy.get('[data-testid="btn-reset"]').should('not.exist')
  })

  it('does not show drawing status when idle', () => {
    cy.get('[data-testid="drawing-status"]').should('not.exist')
  })

  it('does not show track summary when idle', () => {
    cy.get('[data-testid="track-summary"]').should('not.exist')
  })

  // ---------------------------------------------------------------------------
  // Entering drawing mode
  // ---------------------------------------------------------------------------

  it('hides Draw buttons and shows Reset after clicking Draw AVO', () => {
    cy.get('[data-testid="btn-draw-avo"]').click()

    cy.get('[data-testid="btn-draw-avo"]').should('not.exist')
    cy.get('[data-testid="btn-draw-voi"]').should('not.exist')
    cy.get('[data-testid="btn-reset"]').should('be.visible')
  })

  it('shows drawing status with 0 points after entering draw mode', () => {
    cy.get('[data-testid="btn-draw-avo"]').click()

    cy.get('[data-testid="drawing-status"]').should('be.visible').and('contain', '0 pt')
  })

  it('does not show Undo with no points', () => {
    cy.get('[data-testid="btn-draw-avo"]').click()

    cy.get('[data-testid="btn-undo"]').should('not.exist')
  })

  it('does not show Finish button with no points', () => {
    cy.get('[data-testid="btn-draw-avo"]').click()

    cy.get('[data-testid="btn-finish"]').should('not.exist')
  })

  it('does not show track summary while drawing', () => {
    cy.get('[data-testid="btn-draw-avo"]').click()

    cy.get('[data-testid="track-summary"]').should('not.exist')
  })

  it('enters drawing mode with VOI as well', () => {
    cy.get('[data-testid="btn-draw-voi"]').click()

    cy.get('[data-testid="btn-draw-voi"]').should('not.exist')
    cy.get('[data-testid="btn-reset"]').should('be.visible')
  })

  it('enters drawing mode with Training', () => {
    cy.get('[data-testid="btn-draw-training"]').click()

    cy.get('[data-testid="btn-draw-training"]').should('not.exist')
    cy.get('[data-testid="btn-reset"]').should('be.visible')
    cy.get('[data-testid="drawing-status"]').should('contain', 'TRAINING')
  })

  // ---------------------------------------------------------------------------
  // Reset returns to idle
  // ---------------------------------------------------------------------------

  it('returns to idle after Reset', () => {
    cy.get('[data-testid="btn-draw-avo"]').click()
    cy.get('[data-testid="btn-reset"]').click()

    cy.get('[data-testid="btn-draw-avo"]').should('be.visible')
    cy.get('[data-testid="btn-draw-voi"]').should('be.visible')
    cy.get('[data-testid="btn-draw-training"]').should('be.visible')
    cy.get('[data-testid="btn-reset"]').should('not.exist')
    cy.get('[data-testid="drawing-status"]').should('not.exist')
  })
})
