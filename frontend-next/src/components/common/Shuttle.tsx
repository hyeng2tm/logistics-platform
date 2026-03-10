'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Search } from 'lucide-react';
import classNames from 'classnames';
import './Shuttle.css';

export interface ShuttleItem {
  id: string | number;
  label: string;
  originalItem?: unknown;
}

interface ShuttleProps {
  leftTitle?: string;
  rightTitle?: string;
  availableItems: ShuttleItem[];
  selectedItems: ShuttleItem[];
  onChange: (newSelected: ShuttleItem[]) => void;
  className?: string;
}

export const Shuttle: React.FC<ShuttleProps> = ({
  leftTitle = 'Available',
  rightTitle = 'Selected',
  availableItems,
  selectedItems,
  onChange,
  className
}) => {
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [leftSelection, setLeftSelection] = useState<Set<string | number>>(new Set());
  const [rightSelection, setRightSelection] = useState<Set<string | number>>(new Set());

  // Filter out items that are already in the selected list
  const filteredAvailable = availableItems.filter(
    item => !selectedItems.some(s => s.id === item.id)
  );

  const displayedAvailable = filteredAvailable.filter(
    item => item.label.toLowerCase().includes(leftSearch.toLowerCase())
  );

  const displayedSelected = selectedItems.filter(
    item => item.label.toLowerCase().includes(rightSearch.toLowerCase())
  );

  const handleToggleLeft = (id: string | number) => {
    const next = new Set(leftSelection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLeftSelection(next);
  };

  const handleToggleRight = (id: string | number) => {
    const next = new Set(rightSelection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRightSelection(next);
  };

  const moveRight = () => {
    const itemsToMove = filteredAvailable.filter(item => leftSelection.has(item.id));
    onChange([...selectedItems, ...itemsToMove]);
    setLeftSelection(new Set());
  };

  const moveLeft = () => {
    const newSelected = selectedItems.filter(item => !rightSelection.has(item.id));
    onChange(newSelected);
    setRightSelection(new Set());
  };

  const moveAllRight = () => {
    onChange([...selectedItems, ...filteredAvailable]);
    setLeftSelection(new Set());
  };

  const moveAllLeft = () => {
    onChange([]);
    setRightSelection(new Set());
  };

  return (
    <div className={classNames('shuttle-container', className)}>
      {/* Left List */}
      <div className="shuttle-pane">
        <h4 className="shuttle-pane-title">{leftTitle} ({displayedAvailable.length})</h4>
        <div className="shuttle-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={leftSearch} 
            onChange={e => setLeftSearch(e.target.value)}
          />
        </div>
        <div className="shuttle-list custom-scrollbar">
          {displayedAvailable.map(item => (
            <div 
              key={item.id} 
              className={classNames('shuttle-list-item', { selected: leftSelection.has(item.id) })}
              onClick={() => handleToggleLeft(item.id)}
            >
              {item.label}
            </div>
          ))}
          {displayedAvailable.length === 0 && (
            <div className="shuttle-empty">No items</div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="shuttle-controls">
        <button 
          className="shuttle-btn" 
          onClick={moveRight} 
          disabled={leftSelection.size === 0}
          title="Move selected right"
        >
          <ChevronRight size={20} />
        </button>
        <button 
          className="shuttle-btn" 
          onClick={moveAllRight} 
          disabled={filteredAvailable.length === 0}
          title="Move all right"
        >
          <ChevronsRight size={20} />
        </button>
        <div className="shuttle-divider" />
        <button 
          className="shuttle-btn" 
          onClick={moveLeft} 
          disabled={rightSelection.size === 0}
          title="Move selected left"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          className="shuttle-btn" 
          onClick={moveAllLeft} 
          disabled={selectedItems.length === 0}
          title="Move all left"
        >
          <ChevronsLeft size={20} />
        </button>
      </div>

      {/* Right List */}
      <div className="shuttle-pane">
        <h4 className="shuttle-pane-title">{rightTitle} ({displayedSelected.length})</h4>
        <div className="shuttle-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={rightSearch} 
            onChange={e => setRightSearch(e.target.value)}
          />
        </div>
        <div className="shuttle-list custom-scrollbar">
          {displayedSelected.map(item => (
            <div 
              key={item.id} 
              className={classNames('shuttle-list-item', { selected: rightSelection.has(item.id) })}
              onClick={() => handleToggleRight(item.id)}
            >
              {item.label}
            </div>
          ))}
          {displayedSelected.length === 0 && (
            <div className="shuttle-empty">No favorites</div>
          )}
        </div>
      </div>
    </div>
  );
};
