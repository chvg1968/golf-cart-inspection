import { CartPart } from '@/types'

export const DAMAGE_TYPES = [
  { label: 'Scratch', value: 'scratch', diagramPath: '/path/to/scratch.svg' },
  { label: 'Dent', value: 'dent', diagramPath: '/path/to/dent.svg' },
  { label: 'Crack', value: 'crack', diagramPath: '/path/to/crack.svg' },
  { label: 'Broken', value: 'broken', diagramPath: '/path/to/broken.svg' },
  { label: 'Missing', value: 'missing', diagramPath: '/path/to/missing.svg' }
]

export const CART_PARTS = [
  'Front Bumper',
  'Rear Bumper', 
  'Left Side Panel',
  'Right Side Panel',
  'Roof',
  'Windshield',
  'Floor',
  'Seats',
  'Steering Wheel',
  'Dashboard',
  'Battery',
  'Motor',
  'Controller',
  'Charger'
];

export type PropertyOption = {
  label: string;
  value: string;
  diagramPath: string;
}

export const PROPERTY_OPTIONS: PropertyOption[] = [
  {
    label: 'Golf Cart',
    value: 'golf_cart',
    diagramPath: '/path/to/golf_cart.svg'
  },
  {
    label: 'Golf Cart Charger',
    value: 'golf_cart_charger',
    diagramPath: '/path/to/golf_cart_charger.svg'
  },
  {
    label: 'Battery Charger',
    value: 'battery_charger',
    diagramPath: '/path/to/battery_charger.svg'
  },
  {
    label: 'Battery',
    value: 'battery',
    diagramPath: '/path/to/battery.svg'
  },
  {
    label: 'Electrical System',
    value: 'electrical_system',
    diagramPath: '/path/to/electrical_system.svg'
  },
  {
    label: 'Mechanical System',
    value: 'mechanical_system',
    diagramPath: '/path/to/mechanical_system.svg'
  },
  {
    label: 'Other',
    value: 'other',
    diagramPath: '/path/to/other.svg'
  }
];

export const CART_TYPE_OPTIONS = [
  { 
    label: '4-Seater', 
    value: '4_seater', 
    diagramPath: '/path/to/4_seater.svg'
  },
  { 
    label: '6-Seater', 
    value: '6_seater', 
    diagramPath: '/path/to/6_seater.svg'
  }
]
