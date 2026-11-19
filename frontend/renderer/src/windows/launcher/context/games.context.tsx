/**
 * @author Valkream Team
 * @license MIT-NC
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Channel, InstanceId } from "@shared/types";

import instancesRenderConfig from "../../../instances/instances.config";
import { pickChannel } from "../../../instances/instances.helpers";
import type {
  GamesContextValue,
  GamesProviderProps,
} from "./games.context.types";

const GamesContext = createContext<GamesContextValue | undefined>(undefined);
export const useGames = (): GamesContextValue => {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error("useGames doit être utilisé dans un GamesProvider");
  return ctx;
};

export const GamesProvider = ({ children }: GamesProviderProps) => {
  const [actualInstanceId, setActualInstanceId] = useState<InstanceId>(
    instancesRenderConfig[0].id
  );
  const [actualChannel, setActualChannel] = useState<Channel>("stable");

  const actualInstance =
    instancesRenderConfig.find((item) => item.id === actualInstanceId) ??
    instancesRenderConfig[0];

  const changeActualInstance = (instanceId: InstanceId) => {
    if (!instancesRenderConfig.some((item) => item.id === instanceId))
      throw new Error("Game not found");

    return setActualInstanceId(instanceId);
  };

  const refreshChannel = useCallback(async () => {
    try {
      const [betaEnabled, instances] = await Promise.all([
        window.electron_API.getSettings("betaEnabled"),
        window.electron_API.getInstances(),
      ]);
      const summary = instances.find((item) => item.id === actualInstanceId);
      setActualChannel(pickChannel(betaEnabled, summary?.channels ?? []));
    } catch (error) {
      console.error("Erreur lors de la récupération du canal :", error);
    }
  }, [actualInstanceId]);

  useEffect(() => {
    refreshChannel();
  }, [refreshChannel]);

  const contextValue: GamesContextValue = {
    actualInstanceId,
    actualInstance,
    changeActualInstance,
    actualChannel,
    refreshChannel,
  };

  return (
    <GamesContext.Provider value={contextValue}>
      {children}
    </GamesContext.Provider>
  );
};
