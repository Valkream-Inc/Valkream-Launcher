/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Notification système (téléchargement terminé, erreur, action requise). Affichée seulement quand la fenêtre
 * du launcher n'est pas au premier plan : sinon la notification dans l'application suffit.
 */

export const shouldNotify = (focused: boolean, force = false): boolean => force || !focused;

export const notify = (title: string, body: string, force = false): void => {
  try {
    if (typeof Notification === "undefined") return;
    if (!shouldNotify(document.hasFocus(), force)) return;
    const show = () => new Notification(title, { body, silent: false });
    if (Notification.permission === "granted") show();
    else if (Notification.permission !== "denied") {
      void Notification.requestPermission().then((permission) => permission === "granted" && show());
    }
  } catch {
    /* notifications indisponibles : sans conséquence */
  }
};
