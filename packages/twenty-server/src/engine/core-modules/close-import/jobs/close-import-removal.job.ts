import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { CloseImportService } from 'src/engine/core-modules/close-import/services/close-import.service';

@Processor(MessageQueue.workspaceQueue)
export class CloseImportRemovalJob {
  constructor(private readonly closeImportService: CloseImportService) {}

  @Process(CloseImportRemovalJob.name)
  async handle({ workspaceId }: { workspaceId: string }): Promise<void> {
    await this.closeImportService.removeImportedData(workspaceId);
  }
}
