import { Interface, LogDescription } from "@ethersproject/abi";
import { Log } from "@ethersproject/abstract-provider";

export const parseLog = (
  contract: {
    interface: Interface;
  },
  logs: Log[],
  topic?: string
): LogDescription[] => {
  const topicHash = topic ? contract.interface.getEventTopic(topic) : undefined;
  const parsed = logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return undefined;
      }
    })
    .filter((log) => {
      if (topicHash) {
        return log?.topic === topicHash;
      } else {
        return !!log;
      }
    });
  return parsed as LogDescription[];
};
