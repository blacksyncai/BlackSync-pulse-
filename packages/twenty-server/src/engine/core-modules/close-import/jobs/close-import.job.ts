import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { CloseImportService } from 'src/engine/core-modules/close-import/services/close-import.service';
import { type CloseImportJobData } from 'src/engine/core-modules/close-import/types/close-import-status.type';

@Processor(MessageQueue.workspaceQueue)
export class CloseImportJob {
  constructor(private readonly closeImportService: CloseImportService) {}

  @Process(CloseImportJob.name)
  async handle(data: CloseImportJobData): Promise<void> {
    await this.closeImportService.run(data);
  }
}
