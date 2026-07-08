import { Injectable } from '@nestjs/common';
import {
  PsychometricModel,
  UnknownPsychometricModelException,
} from './psychometric-model.interface';
import { DiscModel } from './models/disc.model';
import { BigFiveModel } from './models/big-five.model';

@Injectable()
export class PsychometricRegistry {
  private readonly models: Map<string, PsychometricModel>;

  constructor(discModel: DiscModel, bigFiveModel: BigFiveModel) {
    // Register new models here as they're implemented — no controller or
    // schema change needed alongside them.
    this.models = new Map<string, PsychometricModel>([
      [discModel.key, discModel],
      [bigFiveModel.key, bigFiveModel],
    ]);
  }

  get(modelKey: string): PsychometricModel {
    const model = this.models.get(modelKey);
    if (!model) {
      throw new UnknownPsychometricModelException(modelKey);
    }
    return model;
  }

  list(): Array<{ key: string; label: string }> {
    return [...this.models.values()].map((m) => ({ key: m.key, label: m.label }));
  }
}
