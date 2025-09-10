import React, { createContext, useContext, useState, useCallback } from "react";

const ActionProgressContext = createContext(null);

export const ActionProgressProvider = ({ children }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [currentKey, setCurrentKey] = useState(null);

  const startAction = useCallback(
    (id = "default") => {
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
    async (fn, id = "default") => {
      if (actionLoading) {
        throw new Error("Une action est déjà en cours");
      }
      startAction(id);
      try {
        const result = await Promise.resolve(fn());
        finishAction();
        return result;
      } catch (err) {
        finishAction();
        throw err;
      }
    },
    [actionLoading, startAction, finishAction]
  );

  const value = {
    actionLoading,
    currentKey,
    startAction,
    finishAction,
    runAction,
  };

  return (
    <ActionProgressContext.Provider value={value}>
      {children}
    </ActionProgressContext.Provider>
  );
};

export function useActionProgress() {
  const ctx = useContext(ActionProgressContext);
  if (!ctx)
    throw new Error(
      "useActionProgress doit être utilisé dans un ActionProgressProvider"
    );
  return ctx;
}

export default ActionProgressProvider;

// import React from "react";
// import ActionProgressProvider, { GlobalActionSpinner, useActionProgress } from "./ActionProgressProvider";

// function ExampleButton() {
//   const { runAction, actionLoading } = useActionProgress();

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
//     <ActionProgressProvider>
//       <GlobalActionSpinner />
//       <div className="p-6">
//         <h1 className="text-xl mb-4">Exemple Action Unique</h1>
//         <ExampleButton />
//       </div>
//     </ActionProgressProvider>
//   );
// }
