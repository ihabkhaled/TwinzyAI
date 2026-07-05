import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

import type { FinalGameResult } from '@twinzy/shared';

import type { UploadedImageFile } from '../../file-security/types/upload-file.types';
import { ANALYZE_THROTTLE } from '../constants/throttle.constants';
import { UPLOAD_FIELD_NAME, UPLOAD_MULTER_OPTIONS } from '../constants/upload.constants';
import { GameManager } from '../managers/game.manager';

@Controller('game')
export class GameController {
  public constructor(private readonly gameManager: GameManager) {}

  @Post('analyze')
  @Throttle(ANALYZE_THROTTLE)
  @UseInterceptors(FileInterceptor(UPLOAD_FIELD_NAME, UPLOAD_MULTER_OPTIONS))
  public analyze(
    @UploadedFile() file: UploadedImageFile | undefined,
    @Body() body: unknown,
  ): Promise<FinalGameResult> {
    return this.gameManager.analyze(file, body);
  }
}
