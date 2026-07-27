import { Injectable } from '@nestjs/common';

import { routeEntryKey } from '../../../config/ai-route.types';
import { ProviderRegistryService } from '../adapters/provider-registry.service';
import { runCouncilParticipants } from '../lib/multi-model-council.util';
import type {
  CouncilParticipantTask,
  MultiModelCouncilInput,
  MultiModelCouncilResult,
} from '../model/multi-model-council.types';

@Injectable()
export class MultiModelCouncilService {
  public constructor(private readonly registry: ProviderRegistryService) {}

  public async runTextCouncil(
    input: MultiModelCouncilInput,
  ): Promise<readonly MultiModelCouncilResult[]> {
    const results = await runCouncilParticipants(this.buildTasks(input), input.timeoutMs);
    if (results.length < input.minimumSuccessfulParticipants) {
      throw new Error('AI council did not reach the minimum successful participants');
    }
    return results;
  }

  private buildTasks(input: MultiModelCouncilInput): CouncilParticipantTask[] {
    return input.participants.flatMap((participant) => {
      const adapter = this.registry.adapterFor(participant.provider);
      if (adapter === undefined) {
        return [];
      }
      const task: CouncilParticipantTask = {
        participantId: routeEntryKey(participant),
        run: (signal) =>
          adapter.generateFromTextStream(input.prompt, {
            models: [participant.model],
            signal,
          }),
      };
      return [task];
    });
  }
}
