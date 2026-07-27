export const mirrorPublicFigureModalEnv = (environment: NodeJS.ProcessEnv): void => {
  const serverFlag = environment['WEB_PUBLIC_FIGURE_MODAL_ENABLED'];
  if (serverFlag !== undefined) {
    Object.assign(environment, {
      NEXT_PUBLIC_PUBLIC_FIGURE_MODAL_ENABLED: serverFlag,
    });
  }
};
