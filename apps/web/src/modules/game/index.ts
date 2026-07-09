/**
 * Public surface of the game module. App routes and other modules import only
 * from `@/modules/game`; deep imports into internals are forbidden. The
 * self-contained containers are the primary entry points; the pure landing
 * components are exposed for server-composed pages that resolve copy upstream.
 */
export { GameIntro } from './components/game-intro.component';
export { LandingHero } from './components/landing-hero.component';
export { PrivacyNotice } from './components/privacy-notice.component';
export { GameContainer } from './containers/game.container';
export { LandingContainer } from './containers/landing.container';
export { SharePageContainer } from './containers/share-page.container';
export { GamePhase, type GamePhaseValue } from './model/game.enums';
export type { GameResultView, GameViewModel } from './model/game.types';
export type {
  GameIntroProps,
  LandingHeroProps,
  PrivacyNoticeProps,
} from './model/game-component.types';
