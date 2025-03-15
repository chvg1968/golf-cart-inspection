import { CartPart } from '@/types'

export const DAMAGE_TYPES = [
  { label: 'Scratch', value: 'scratch', diagramPath: '/path/to/scratch.svg' },
  { label: 'Dent', value: 'dent', diagramPath: '/path/to/dent.svg' },
  { label: 'Crack', value: 'crack', diagramPath: '/path/to/crack.svg' },
  { label: 'Broken', value: 'broken', diagramPath: '/path/to/broken.svg' },
  { label: 'Missing', value: 'missing', diagramPath: '/path/to/missing.svg' }
]

export const CART_PARTS = [
  

1 Front Bumper
2
Rear Bumper
3
Left Front Fender
4
Right Front Fender
5
Left Rear Fender
6
Right Rear Fender
7
Left Side Panel
8
Right Side Panel
9
Roof
10
Windshield
11
Left Mirror
12
Right Mirror
13
Front Lights
14
Rear Lights
15
Left Door (if applicable)
16
Right Door (if applicable)
17
Roof Supports (Front & Rear)
18
Grab Handles
19
Rear Cargo Rack / Rear Step
20
Roof Brackets
21
Front Row - Driver Seat Cushion
22
Front Row - Driver Seat Backrest
23
Front Row - Passenger Seat Cushion
24
Front Row - Passenger Seat Backrest
25
Middle Row - Left Seat Cushion
26
Middle Row - Left Seat Backrest
27
Middle Row - Right Seat Cushion
28
Middle Row - Right Seat Backrest
29
Rear Row - Left Seat Cushion
30
Rear Row - Left Seat Backrest
31
Rear Row - Right Seat Cushion
32
Rear Row - Right Seat Backrest
33
Steering Wheel
34
Dashboard
35
Pedals
36
Speedometer (if applicable)
37
Ignition Switch / Key Slot
38
Horn Button
39
Left Front Wheel Rim
40
Right Front Wheel Rim
41
Left Rear Wheel Rim
42
Right Rear Wheel Rim
43
Left Front Tire
44
Right Front Tire
45
Left Rear Tire
46
Right Rear Tire
47
Side Grab Bars
48
Rear Safety Bar
49
Chassis Frame
50
Suspension System
51
Battery Compartment
52
Charging Port
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
