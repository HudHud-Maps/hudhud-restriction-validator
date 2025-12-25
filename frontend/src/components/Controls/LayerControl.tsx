/**
 * Layer control component for switching base layers
 */

import type { BaseLayerType } from '../../types';
import { tileLayers } from '../../config/tiles';

interface LayerControlProps {
  activeLayer: BaseLayerType;
  onLayerChange: (layer: BaseLayerType) => void;
}

export function LayerControl({ activeLayer, onLayerChange }: LayerControlProps) {
  // Get layers dynamically from tileLayers config
  const layers = Object.keys(tileLayers) as BaseLayerType[];

  return (
    <div className="layer-control">
      <div className="control-title">Base Layer</div>
      <div className="layer-options">
        {layers.map((layer) => (
          <label key={layer} className="layer-option">
            <input
              type="radio"
              name="baseLayer"
              checked={activeLayer === layer}
              onChange={() => onLayerChange(layer)}
            />
            <span className="layer-radio"></span>
            <span className="layer-name">{tileLayers[layer].name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

