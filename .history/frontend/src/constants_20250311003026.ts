import { CartPart, CartTypeOption, DamageType } from '@/types'

export const CART_PARTS: CartPart[] = [
  {
    id: 'front_bumper',
    name: 'Front Bumper',
    value: 'Front Bumper',
    category: 'Exterior'
  },
  {
    id: 'rear_bumper',
    name: 'Rear Bumper',
    value: 'Rear Bumper',
    category: 'Exterior'
  },
  {
    id: 'left_front_fender',
    name: 'Left Front Fender',
    value: 'Left Front Fender',
    category: 'Exterior'
  },
  {
    id: 'right_front_fender',
    name: 'Right Front Fender',
    value: 'Right Front Fender',
    category: 'Exterior'
  },
  {
    id: 'left_rear_fender',
    name: 'Left Rear Fender',
    value: 'Left Rear Fender',
    category: 'Exterior'
  },
  {
    id: 'right_rear_fender',
    name: 'Right Rear Fender',
    value: 'Right Rear Fender',
    category: 'Exterior'
  },
  {
    id: 'left_side_panel',
    name: 'Left Side Panel',
    value: 'Left Side Panel',
    category: 'Exterior'
  },
  {
    id: 'right_side_panel',
    name: 'Right Side Panel',
    value: 'Right Side Panel',
    category: 'Exterior'
  },
  {
    id: 'roof',
    name: 'Roof',
    value: 'Roof',
    category: 'Exterior'
  },
  {
    id: 'windshield',
    name: 'Windshield',
    value: 'Windshield',
    category: 'Exterior'
  },
  {
    id: 'left_mirror',
    name: 'Left Mirror',
    value: 'Left Mirror',
    category: 'Exterior'
  },
  {
    id: 'right_mirror',
    name: 'Right Mirror',
    value: 'Right Mirror',
    category: 'Exterior'
  },
  {
    id: 'front_lights',
    name: 'Front Lights',
    value: 'Front Lights',
    category: 'Exterior'
  },
  {
    id: 'rear_lights',
    name: 'Rear Lights',
    value: 'Rear Lights',
    category: 'Exterior'
  },
  {
    id: 'left_door__if_applicable_',
    name: 'Left Door (if applicable)',
    value: 'Left Door (if applicable)',
    category: 'Exterior'
  },
  {
    id: 'right_door__if_applicable_',
    name: 'Right Door (if applicable)',
    value: 'Right Door (if applicable)',
    category: 'Exterior'
  },
  {
    id: 'roof_supports__front___rear_',
    name: 'Roof Supports (Front & Rear)',
    value: 'Roof Supports (Front & Rear)',
    category: 'Exterior'
  },
  {
    id: 'grab_handles',
    name: 'Grab Handles',
    value: 'Grab Handles',
    category: 'Exterior'
  },
  {
    id: 'rear_cargo_rack___rear_step',
    name: 'Rear Cargo Rack / Rear Step',
    value: 'Rear Cargo Rack / Rear Step',
    category: 'Exterior'
  },
  {
    id: 'roof_brackets',
    name: 'Roof Brackets',
    value: 'Roof Brackets',
    category: 'Exterior'
  },
  {
    id: 'front_row___driver_seat_cushion',
    name: 'Front Row - Driver Seat Cushion',
    value: 'Front Row - Driver Seat Cushion',
    category: 'Seats'
  },
  {
    id: 'front_row___driver_seat_backrest',
    name: 'Front Row - Driver Seat Backrest',
    value: 'Front Row - Driver Seat Backrest',
    category: 'Seats'
  },
  {
    id: 'front_row___passenger_seat_cushion',
    name: 'Front Row - Passenger Seat Cushion',
    value: 'Front Row - Passenger Seat Cushion',
    category: 'Seats'
  },
  {
    id: 'front_row___passenger_seat_backrest',
    name: 'Front Row - Passenger Seat Backrest',
    value: 'Front Row - Passenger Seat Backrest',
    category: 'Seats'
  },
  {
    id: 'middle_row___left_seat_cushion',
    name: 'Middle Row - Left Seat Cushion',
    value: 'Middle Row - Left Seat Cushion',
    category: 'Seats'
  },
  {
    id: 'middle_row___left_seat_backrest',
    name: 'Middle Row - Left Seat Backrest',
    value: 'Middle Row - Left Seat Backrest',
    category: 'Seats'
  },
  {
    id: 'middle_row___right_seat_cushion',
    name: 'Middle Row - Right Seat Cushion',
    value: 'Middle Row - Right Seat Cushion',
    category: 'Seats'
  },
  {
    id: 'middle_row___right_seat_backrest',
    name: 'Middle Row - Right Seat Backrest',
    value: 'Middle Row - Right Seat Backrest',
    category: 'Seats'
  },
  {
    id: 'rear_row___left_seat_cushion',
    name: 'Rear Row - Left Seat Cushion',
    value: 'Rear Row - Left Seat Cushion',
    category: 'Seats'
  },
  {
    id: 'rear_row___left_seat_backrest',
    name: 'Rear Row - Left Seat Backrest',
    value: 'Rear Row - Left Seat Backrest',
    category: 'Seats'
  },
  {
    id: 'rear_row___right_seat_cushion',
    name: 'Rear Row - Right Seat Cushion',
    value: 'Rear Row - Right Seat Cushion',
    category: 'Seats'
  },
  {
    id: 'rear_row___right_seat_backrest',
    name: 'Rear Row - Right Seat Backrest',
    value: 'Rear Row - Right Seat Backrest',
    category: 'Seats'
  },
  {
    id: 'steering_wheel',
    name: 'Steering Wheel',
    value: 'Steering Wheel',
    category: 'Interior'
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    value: 'Dashboard',
    category: 'Interior'
  },
  {
    id: 'pedals',
    name: 'Pedals',
    value: 'Pedals',
    category: 'Interior'
  },
  {
    id: 'speedometer__if_applicable_',
    name: 'Speedometer (if applicable)',
    value: 'Speedometer (if applicable)',
    category: 'Interior'
  },
  {
    id: 'ignition_switch___key_slot',
    name: 'Ignition Switch / Key Slot',
    value: 'Ignition Switch / Key Slot',
    category: 'Interior'
  },
  {
    id: 'horn_button',
    name: 'Horn Button',
    value: 'Horn Button',
    category: 'Interior'
  },
  {
    id: 'left_front_wheel_rim',
    name: 'Left Front Wheel Rim',
    value: 'Left Front Wheel Rim',
    category: 'Mechanical'
  },
  {
    id: 'right_front_wheel_rim',
    name: 'Right Front Wheel Rim',
    value: 'Right Front Wheel Rim',
    category: 'Mechanical'
  },
  {
    id: 'left_rear_wheel_rim',
    name: 'Left Rear Wheel Rim',
    value: 'Left Rear Wheel Rim',
    category: 'Mechanical'
  },
  {
    id: 'right_rear_wheel_rim',
    name: 'Right Rear Wheel Rim',
    value: 'Right Rear Wheel Rim',
    category: 'Mechanical'
  },
  {
    id: 'left_front_tire',
    name: 'Left Front Tire',
    value: 'Left Front Tire',
    category: 'Mechanical'
  },
  {
    id: 'right_front_tire',
    name: 'Right Front Tire',
    value: 'Right Front Tire',
    category: 'Mechanical'
  },
  {
    id: 'left_rear_tire',
    name: 'Left Rear Tire',
    value: 'Left Rear Tire',
    category: 'Mechanical'
  },
  {
    id: 'right_rear_tire',
    name: 'Right Rear Tire',
    value: 'Right Rear Tire',
    category: 'Mechanical'
  },
  {
    id: 'side_grab_bars',
    name: 'Side Grab Bars',
    value: 'Side Grab Bars',
    category: 'Exterior'
  },
  {
    id: 'rear_safety_bar',
    name: 'Rear Safety Bar',
    value: 'Rear Safety Bar',
    category: 'Exterior'
  },
  {
    id: 'chassis_frame',
    name: 'Chassis Frame',
    value: 'Chassis Frame',
    category: 'Mechanical'
  },
  {
    id: 'suspension_system',
    name: 'Suspension System',
    value: 'Suspension System',
    category: 'Mechanical'
  },
  {
    id: 'battery_compartment',
    name: 'Battery Compartment',
    value: 'Battery Compartment',
    category: 'Mechanical'
  },
  {
    id: 'charging_port',
    name: 'Charging Port',
    value: 'Charging Port',
    category: 'Mechanical'
  },
]

export const GOLF_CART_TYPES: CartTypeOption[] = [
  { id: '4seaters', name: '4 Seaters', value: '4 Seaters', diagramPath: 'assets/images/4seaters.png' },
  { id: '6seaters', name: '6 Seaters', value: '6 Seaters', diagramPath: 'assets/images/6seaters.png' }
]

export const PROPERTIES: CartProperty[] = [
  { id: 'atl_g7_casa_prestige', name: 'Atl. G7 Casa Prestige', type: 'string', required: false },
  { id: 'est_24_casa_paraiso', name: 'Est. 24 Casa Paraiso', type: 'string', required: false },
  { id: '3325_villa_clara', name: '3325 Villa Clara', type: 'string', required: false },
  { id: '7256_villa_palacio', name: '7256 Villa Palacio', type: 'string', required: false },
  { id: '10180_villa_flora', name: '10180 Villa Flora', type: 'string', required: false },
  { id: '5138_villa_paloma', name: '5138 Villa Paloma', type: 'string', required: false },
  { id: 'temporal', name: 'Temporal', type: 'string', required: false },
  { id: '2_102_villa_ocean_bliss', name: '2-102 Villa Ocean Bliss', type: 'string', required: false },
  { id: '10389_villa_tiffany', name: '10389 Villa Tiffany', type: 'string', required: false },
  { id: '2_208_ocean_haven_villa', name: '2-208 Ocean Haven Villa', type: 'string', required: false }
]

export const DAMAGE_TYPES: DamageType[] = [
  { id: 'scratches', name: 'Scratches', severity: 'Low' },
  { id: 'missing_parts', name: 'Missing Parts', severity: 'Critical' },
  { id: 'damage_bumps', name: 'Damage/Bumps', severity: 'Medium' }
]