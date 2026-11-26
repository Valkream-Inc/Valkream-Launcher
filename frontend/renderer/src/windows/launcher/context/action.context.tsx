/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { createContext, useContext, useState, useCallback } from "react";

import type {
  ActionContextValue,
  ActionProviderProps,
} from "./action.context.types";

const ActionContext = createContext<ActionContextValue | undefined>(undefined);

export const ActionProvider = ({ children }: ActionProviderProps) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  // Plusieurs composants peuvent demander le maintien des panneaux (popup, téléchargement, suppression) :
  // il dure tant qu'au moins un demandeur est actif, sans qu'un composant ne puisse écraser la demande d'un autre.
  const [keepAliveOwners, setKeepAliveOwners] = useState<ReadonlySet<string>>(new Set());
  const keepAlive = keepAliveOwners.size > 0;
  const setKeepAlive = useCallback((owner: string, active: boolean) => {
    setKeepAliveOwners((previous) => {
      if (previous.has(owner) === active) return previous;
      const next = new Set(previous);
      if (active) next.add(owner);
      else next.delete(owner);
      return next;
    });
  }, []);
  const [devActive, setDevActive] = useState(false);

  const startAction = useCallback(
    (id: string = "default"): string | null => {
      if (actionLoading) {
        console.warn(
          "Une action est déjà en cours, impossible d'en lancer une autre."
        );
        return null;
      }
      setCurrentKey(id);
      setActionLoading(true);
      return id;
    },
    [actionLoading]
  );

  const finishAction = useCallback(() => {
    setActionLoading(false);
    setCurrentKey(null);
  }, []);

  const runAction = useCallback(
    async <T,>(fn: () => T | Promise<T>, id: string = "default"): Promise<T> => {
      if (actionLoading) {
        throw new Error("Une action est déjà en cours");
      }
      startAction(id);
      try {
        const result = (await Promise.resolve(fn())) as T;
        finishAction();
        return result;
      } catch (err) {
        finishAction();
        throw err;
      }
    },
    [actionLoading, startAction, finishAction]
  );

  const value: ActionContextValue = {
    actionLoading,
    currentKey,
    keepAlive,
    setKeepAlive,
    devActive,
    setDevActive,
    startAction,
    finishAction,
    runAction,
  };

  return (
    <ActionContext.Provider value={value}>{children}</ActionContext.Provider>
  );
};

export function useAction() {
  const ctx = useContext(ActionContext);
  if (!ctx)
    throw new Error("useAction doit être utilisé dans un ActionProvider");
  return ctx;
}

export default ActionProvider;

// import React from "react";
// import ActionProvider, { GlobalActionSpinner, useAction } from "./ActionProvider";

// function ExampleButton() {
//   const { runAction, actionLoading } = useAction();

//   const handleClick = () => {
//     runAction(async () => {
//       // Simulation d'une tâche longue (2 sec)
//       await new Promise((resolve) => setTimeout(resolve, 2000));
//       alert("Action terminée !");
//     }, "save");
//   };

//   return (
//     <button
//       onClick={handleClick}
//       disabled={actionLoading}
//       className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
//     >
//       {actionLoading ? "En cours..." : "Lancer l'action"}
//     </button>
//   );
// }

// export default function App() {
//   return (
//     <ActionProvider>
//       <GlobalActionSpinner />
//       <div className="p-6">
//         <h1 className="text-xl mb-4">Exemple Action Unique</h1>
//         <ExampleButton />
//       </div>
//     </ActionProvider>
//   );
// }
