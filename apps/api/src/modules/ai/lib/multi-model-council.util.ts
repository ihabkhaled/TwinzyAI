import type {
  CouncilParticipantTask,
  MultiModelCouncilResult,
} from '../model/multi-model-council.types';

const runParticipant = async (
  task: CouncilParticipantTask,
  timeoutMs: number,
): Promise<MultiModelCouncilResult> => {
  const signal = AbortSignal.timeout(timeoutMs);
  return { participantId: task.participantId, text: await task.run(signal) };
};

export const runCouncilParticipants = async (
  tasks: readonly CouncilParticipantTask[],
  timeoutMs: number,
): Promise<MultiModelCouncilResult[]> => {
  const settled = await Promise.allSettled(tasks.map((task) => runParticipant(task, timeoutMs)));
  return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
};
