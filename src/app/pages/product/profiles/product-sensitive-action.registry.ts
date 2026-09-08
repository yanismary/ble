import {
  ProductSensitiveActionUiConfig,
  ProductSensitiveActionWriteStep,
  productLearningSensitiveActionWriteSteps,
} from '../shared/actions/product-sensitive-action';
import { widoorSensitiveActionWriteSteps } from
  './widoor/widoor-sensitive-action';

export function productSensitiveActionWriteSteps(
  config: ProductSensitiveActionUiConfig,
  enabled?: boolean,
): readonly ProductSensitiveActionWriteStep[] {
  return config.action === 'learning'
    ? productLearningSensitiveActionWriteSteps(config)
    : widoorSensitiveActionWriteSteps(config, enabled);
}
