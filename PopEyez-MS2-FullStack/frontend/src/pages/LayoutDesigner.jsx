import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const palette = ['Coffee Bar', 'Seating Area', 'Check-In Desk', 'Buffet Table', 'Photo Spot', 'Stage'];

export default function LayoutDesigner({ selectedEventId, setNotice, role }) {
  const [layout, setLayout] = useState({ eventId: selectedEventId, sharedWithSetupTeam: false, elements: [] });
  const [selectedType, setSelectedType] = useState('Coffee Bar');

  function load() {
    api.get(`/layouts/${selectedEventId}`)
      .then(setLayout)
      .catch((error) => setNotice(error.message));
  }

  useEffect(load, [selectedEventId]);

  const exportedLayout = useMemo(() => JSON.stringify(layout, null, 2), [layout]);

  async function saveLayout(nextLayout = layout) {
    try {
      const saved = await api.patch(`/layouts/${selectedEventId}`, nextLayout);
      setLayout(saved);
      setNotice('Venue layout saved and available to the setup team.');
    } catch (error) {
      setNotice(error.message);
    }
  }

  function addElement() {
    const element = { id: `EL-${Date.now()}`, type: selectedType, x: 50 + layout.elements.length * 20, y: 60 + layout.elements.length * 20 };
    setLayout({ ...layout, elements: [...layout.elements, element] });
  }

  function moveElement(id, direction) {
    const delta = 20;
    const movement = {
      left: [-delta, 0],
      right: [delta, 0],
      up: [0, -delta],
      down: [0, delta]
    }[direction];
    const next = {
      ...layout,
      elements: layout.elements.map((element) => element.id === id ? { ...element, x: Math.max(0, element.x + movement[0]), y: Math.max(0, element.y + movement[1]) } : element)
    };
    setLayout(next);
  }

  function downloadLayout() {
    const blob = new Blob([exportedLayout], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEventId}-layout.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h3>Digital venue layout. </h3>
          <p>Design floor plans, share with setup staff, and export the layout. Use the arrows to move elements.</p>
        </div>
        {role === 'organizer' && (
          <div className="button-row">
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              {palette.map((item) => <option key={item}>{item}</option>)}
            </select>
            <button onClick={addElement}>Add element</button>
            <button onClick={() => saveLayout({ ...layout, sharedWithSetupTeam: true })}>Share with team</button>
            <button onClick={() => saveLayout()}>Save</button>
            <button onClick={downloadLayout}>Export</button>
          </div>
        )}
      </div>

      <div className="layout-board">
        {layout.elements.map((element) => (
          <div key={element.id} className="layout-element" style={{ left: `${element.x}px`, top: `${element.y}px` }}>
            <strong>{element.type}</strong>
            {role === 'organizer' && (
              <div className="element-controls">
                <button onClick={() => moveElement(element.id, 'up')}>↑</button>
                <button onClick={() => moveElement(element.id, 'left')}>←</button>
                <button onClick={() => moveElement(element.id, 'right')}>→</button>
                <button onClick={() => moveElement(element.id, 'down')}>↓</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="muted">Shared wth setup team: {layout.sharedWithSetupTeam ? 'Yes' : 'No'}</p>
    </section>
  );
  // test commit by John

}
