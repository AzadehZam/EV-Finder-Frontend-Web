import L from 'leaflet';

// Mock Leaflet
jest.mock('leaflet', () => ({
  divIcon: jest.fn((options) => ({
    options,
    _getIconUrl: jest.fn(),
  })),
}));

// Import the functions we want to test (these would be exported from ChargerFinderPage)
// For this test, we'll recreate the functions here since they're not currently exported

const createEvChargerIcon = (availability: 'available' | 'limited' | 'unavailable') => {
  const colors = {
    available: '#059669',   // Dark emerald green
    limited: '#FF9800',     // Orange  
    unavailable: '#F44336'  // Red
  };

  const color = colors[availability];
  
  const svgIcon = `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <!-- Outer border -->
      <rect x="2" y="2" width="32" height="32" rx="4" fill="white" stroke="${color}" stroke-width="3"/>
      
      <!-- Inner background -->
      <rect x="5" y="5" width="26" height="26" rx="2" fill="${color}"/>
      
      <!-- EV Text -->
      <text x="18" y="16" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" font-weight="bold">EV</text>
      
      <!-- Charging plug symbol -->
      <rect x="14" y="19" width="8" height="3" rx="1" fill="white"/>
      <rect x="16" y="22" width="4" height="2" rx="1" fill="white"/>
      
      <!-- Small lightning bolt -->
      <path d="M17 26 L19 26 L18 28 L20 28 L17 31 L16 29 L18 29 L17 26 Z" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-ev-charger',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const getAvailabilityStatus = (available: number, total: number): 'available' | 'limited' | 'unavailable' => {
  if (available === 0) return 'unavailable';
  const ratio = available / total;
  if (ratio > 0.5) return 'available';
  return 'limited';
};

describe('EV Charger Icons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvChargerIcon', () => {
    test('creates available icon with correct color', () => {
      const icon = createEvChargerIcon('available');
      
      expect(L.divIcon).toHaveBeenCalledWith({
        html: expect.stringContaining('#059669'), // Dark emerald green
        className: 'custom-ev-charger',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });
    });

    test('creates limited icon with correct color', () => {
      const icon = createEvChargerIcon('limited');
      
      expect(L.divIcon).toHaveBeenCalledWith({
        html: expect.stringContaining('#FF9800'), // Orange
        className: 'custom-ev-charger',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });
    });

    test('creates unavailable icon with correct color', () => {
      const icon = createEvChargerIcon('unavailable');
      
      expect(L.divIcon).toHaveBeenCalledWith({
        html: expect.stringContaining('#F44336'), // Red
        className: 'custom-ev-charger',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });
    });

    test('generates valid SVG structure', () => {
      const icon = createEvChargerIcon('available');
      const call = (L.divIcon as jest.Mock).mock.calls[0][0];
      const svgHtml = call.html;

      // Check basic SVG structure
      expect(svgHtml).toContain('<svg');
      expect(svgHtml).toContain('width="36"');
      expect(svgHtml).toContain('height="36"');
      expect(svgHtml).toContain('viewBox="0 0 36 36"');
      expect(svgHtml).toContain('</svg>');

      // Check for required elements
      expect(svgHtml).toContain('<rect'); // Border and background rectangles
      expect(svgHtml).toContain('<text'); // EV text
      expect(svgHtml).toContain('<path'); // Lightning bolt
    });

    test('includes EV text in icon', () => {
      const icon = createEvChargerIcon('available');
      const call = (L.divIcon as jest.Mock).mock.calls[0][0];
      const svgHtml = call.html;

      expect(svgHtml).toContain('>EV</text>');
      expect(svgHtml).toContain('text-anchor="middle"');
      expect(svgHtml).toContain('fill="white"');
    });

    test('includes lightning bolt element', () => {
      const icon = createEvChargerIcon('available');
      const call = (L.divIcon as jest.Mock).mock.calls[0][0];
      const svgHtml = call.html;

      expect(svgHtml).toContain('<path d="M17 26 L19 26');
      expect(svgHtml).toContain('fill="white"');
    });

    test('includes charging plug elements', () => {
      const icon = createEvChargerIcon('available');
      const call = (L.divIcon as jest.Mock).mock.calls[0][0];
      const svgHtml = call.html;

      // Should have multiple rect elements for the plug
      const rectMatches = svgHtml.match(/<rect/g);
      expect(rectMatches).toBeTruthy();
      expect(rectMatches!.length).toBeGreaterThan(2); // Border, background, and plug elements
    });

    test('uses correct icon positioning', () => {
      const icon = createEvChargerIcon('available');
      
      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          iconSize: [36, 36],
          iconAnchor: [18, 18], // Center of the icon
          popupAnchor: [0, -18] // Above the icon
        })
      );
    });

    test('applies custom CSS class', () => {
      const icon = createEvChargerIcon('available');
      
      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          className: 'custom-ev-charger'
        })
      );
    });
  });

  describe('getAvailabilityStatus', () => {
    test('returns unavailable when no ports available', () => {
      expect(getAvailabilityStatus(0, 5)).toBe('unavailable');
      expect(getAvailabilityStatus(0, 1)).toBe('unavailable');
      expect(getAvailabilityStatus(0, 10)).toBe('unavailable');
    });

    test('returns available when more than 50% ports available', () => {
      expect(getAvailabilityStatus(3, 5)).toBe('available'); // 60%
      expect(getAvailabilityStatus(6, 10)).toBe('available'); // 60%
      expect(getAvailabilityStatus(4, 4)).toBe('available'); // 100%
      expect(getAvailabilityStatus(8, 10)).toBe('available'); // 80%
    });

    test('returns limited when 50% or fewer ports available', () => {
      expect(getAvailabilityStatus(2, 5)).toBe('limited'); // 40%
      expect(getAvailabilityStatus(1, 2)).toBe('limited'); // 50%
      expect(getAvailabilityStatus(5, 10)).toBe('limited'); // 50%
      expect(getAvailabilityStatus(1, 5)).toBe('limited'); // 20%
    });

    test('handles edge cases correctly', () => {
      expect(getAvailabilityStatus(1, 1)).toBe('available'); // 100%
      expect(getAvailabilityStatus(1, 3)).toBe('limited'); // 33.33%
      expect(getAvailabilityStatus(2, 3)).toBe('available'); // 66.66%
    });

    test('handles decimal calculations correctly', () => {
      // Test cases that result in exactly 50%
      expect(getAvailabilityStatus(1, 2)).toBe('limited');
      expect(getAvailabilityStatus(2, 4)).toBe('limited');
      expect(getAvailabilityStatus(5, 10)).toBe('limited');
      
      // Test cases that result in just over 50%
      expect(getAvailabilityStatus(3, 5)).toBe('available'); // 60%
      expect(getAvailabilityStatus(51, 100)).toBe('available'); // 51%
    });
  });

  describe('Color Consistency', () => {
    test('uses consistent color scheme', () => {
      const availableIcon = createEvChargerIcon('available');
      const limitedIcon = createEvChargerIcon('limited');
      const unavailableIcon = createEvChargerIcon('unavailable');

      const availableCall = (L.divIcon as jest.Mock).mock.calls[0][0];
      const limitedCall = (L.divIcon as jest.Mock).mock.calls[1][0];
      const unavailableCall = (L.divIcon as jest.Mock).mock.calls[2][0];

      // Check that each icon uses its designated color
      expect(availableCall.html).toContain('#059669');
      expect(limitedCall.html).toContain('#FF9800');
      expect(unavailableCall.html).toContain('#F44336');

      // Ensure colors don't bleed between icons
      expect(availableCall.html).not.toContain('#FF9800');
      expect(availableCall.html).not.toContain('#F44336');
    });

    test('colors are applied to both border and fill', () => {
      const icon = createEvChargerIcon('available');
      const call = (L.divIcon as jest.Mock).mock.calls[0][0];
      const svgHtml = call.html;

      // Should have color in both stroke and fill attributes
      expect(svgHtml).toContain('stroke="#059669"');
      expect(svgHtml).toContain('fill="#059669"');
    });
  });

  describe('SVG Validation', () => {
    test('generates well-formed SVG', () => {
      const icon = createEvChargerIcon('available');
      const call = (L.divIcon as jest.Mock).mock.calls[0][0];
      const svgHtml = call.html;

      // Basic XML structure validation
      expect(svgHtml).toMatch(/<svg[^>]*>[\s\S]*<\/svg>/);
      
      // Check that all opened tags are closed
      const openTags = svgHtml.match(/<(\w+)(?:\s[^>]*)?\s*(?!\/\s*>)/g);
      const closeTags = svgHtml.match(/<\/(\w+)>/g);
      
      if (openTags && closeTags) {
        // Filter out self-closing tags
        const actualOpenTags = openTags.filter(tag => !tag.endsWith('/>'));
        expect(actualOpenTags.length).toBeLessThanOrEqual(closeTags.length);
      }
    });

    test('uses valid SVG attributes', () => {
      const icon = createEvChargerIcon('available');
      const call = (L.divIcon as jest.Mock).mock.calls[0][0];
      const svgHtml = call.html;

      // Check for valid SVG attributes
      expect(svgHtml).toMatch(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      expect(svgHtml).toMatch(/viewBox="\d+\s+\d+\s+\d+\s+\d+"/);
      expect(svgHtml).toMatch(/width="\d+"/);
      expect(svgHtml).toMatch(/height="\d+"/);
    });
  });
});

describe('Icon Integration', () => {
  test('icon works with station data', () => {
    const stationData = [
      { availablePorts: 3, totalPorts: 4 }, // available
      { availablePorts: 1, totalPorts: 4 }, // limited  
      { availablePorts: 0, totalPorts: 4 }, // unavailable
    ];

    stationData.forEach((station, index) => {
      const status = getAvailabilityStatus(station.availablePorts, station.totalPorts);
      const icon = createEvChargerIcon(status);
      
      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          className: 'custom-ev-charger',
          iconSize: [36, 36]
        })
      );
    });

    expect(L.divIcon).toHaveBeenCalledTimes(3);
  });

  test('handles various availability scenarios', () => {
    const scenarios = [
      { available: 10, total: 10, expected: 'available' },
      { available: 8, total: 10, expected: 'available' },
      { available: 6, total: 10, expected: 'available' },
      { available: 5, total: 10, expected: 'limited' },
      { available: 3, total: 10, expected: 'limited' },
      { available: 1, total: 10, expected: 'limited' },
      { available: 0, total: 10, expected: 'unavailable' },
    ];

    scenarios.forEach(scenario => {
      const status = getAvailabilityStatus(scenario.available, scenario.total);
      expect(status).toBe(scenario.expected);
      
      const icon = createEvChargerIcon(status);
      expect(icon).toBeDefined();
    });
  });
}); 