import { 
  CartPart, 
  CartTypeOption, 
  CartProperty, 
  DamageType, 
  CartPartCategory 
} from './types'

export const CART_PARTS: CartPart[] = [
  {
    id: 'front_bumper',
    name: 'Front Bumper',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'rear_bumper',
    name: 'Rear Bumper',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'left_front_fender',
    name: 'Left Front Fender',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'right_front_fender',
    name: 'Right Front Fender',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'left_rear_fender',
    name: 'Left Rear Fender',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'right_rear_fender',
    name: 'Right Rear Fender',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'left_side_panel',
    name: 'Left Side Panel',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'right_side_panel',
    name: 'Right Side Panel',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'roof',
    name: 'Roof',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'windshield',
    name: 'Windshield',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'left_mirror',
    name: 'Left Mirror',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'right_mirror',
    name: 'Right Mirror',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'front_lights',
    name: 'Front Lights',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'rear_lights',
    name: 'Rear Lights',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'left_door__if_applicable_',
    name: 'Left Door (if applicable)',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'right_door__if_applicable_',
    name: 'Right Door (if applicable)',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'roof_supports__front___rear_',
    name: 'Roof Supports (Front & Rear)',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'grab_handles',
    name: 'Grab Handles',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'rear_cargo_rack___rear_step',
    name: 'Rear Cargo Rack / Rear Step',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'roof_brackets',
    name: 'Roof Brackets',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'front_row___driver_seat_cushion',
    name: 'Front Row - Driver Seat Cushion',
    category: CartPartCategory.SEATS
  },
  {
    id: 'front_row___driver_seat_backrest',
    name: 'Front Row - Driver Seat Backrest',
    category: CartPartCategory.SEATS
  },
  {
    id: 'front_row___passenger_seat_cushion',
    name: 'Front Row - Passenger Seat Cushion',
    category: CartPartCategory.SEATS
  },
  {
    id: 'front_row___passenger_seat_backrest',
    name: 'Front Row - Passenger Seat Backrest',
    category: CartPartCategory.SEATS
  },
  {
    id: 'middle_row___left_seat_cushion',
    name: 'Middle Row - Left Seat Cushion',
    category: CartPartCategory.SEATS
  },
  {
    id: 'middle_row___left_seat_backrest',
    name: 'Middle Row - Left Seat Backrest',
    category: CartPartCategory.SEATS
  },
  {
    id: 'middle_row___right_seat_cushion',
    name: 'Middle Row - Right Seat Cushion',
    category: CartPartCategory.SEATS
  },
  {
    id: 'middle_row___right_seat_backrest',
    name: 'Middle Row - Right Seat Backrest',
    category: CartPartCategory.SEATS
  },
  {
    id: 'rear_row___left_seat_cushion',
    name: 'Rear Row - Left Seat Cushion',
    category: CartPartCategory.SEATS
  },
  {
    id: 'rear_row___left_seat_backrest',
    name: 'Rear Row - Left Seat Backrest',
    category: CartPartCategory.SEATS
  },
  {
    id: 'rear_row___right_seat_cushion',
    name: 'Rear Row - Right Seat Cushion',
    category: CartPartCategory.SEATS
  },
  {
    id: 'rear_row___right_seat_backrest',
    name: 'Rear Row - Right Seat Backrest',
    category: CartPartCategory.SEATS
  },
  {
    id: 'steering_wheel',
    name: 'Steering Wheel',
    category: CartPartCategory.INTERIOR
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    category: CartPartCategory.INTERIOR
  },
  {
    id: 'pedals',
    name: 'Pedals',
    category: CartPartCategory.INTERIOR
  },
  {
    id: 'speedometer__if_applicable_',
    name: 'Speedometer (if applicable)',
    category: CartPartCategory.INTERIOR
  },
  {
    id: 'ignition_switch___key_slot',
    name: 'Ignition Switch / Key Slot',
    category: CartPartCategory.INTERIOR
  },
  {
    id: 'horn_button',
    name: 'Horn Button',
    category: CartPartCategory.INTERIOR
  },
  {
    id: 'left_front_wheel_rim',
    name: 'Left Front Wheel Rim',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'right_front_wheel_rim',
    name: 'Right Front Wheel Rim',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'left_rear_wheel_rim',
    name: 'Left Rear Wheel Rim',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'right_rear_wheel_rim',
    name: 'Right Rear Wheel Rim',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'left_front_tire',
    name: 'Left Front Tire',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'right_front_tire',
    name: 'Right Front Tire',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'left_rear_tire',
    name: 'Left Rear Tire',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'right_rear_tire',
    name: 'Right Rear Tire',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'side_grab_bars',
    name: 'Side Grab Bars',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'rear_safety_bar',
    name: 'Rear Safety Bar',
    category: CartPartCategory.EXTERIOR
  },
  {
    id: 'chassis_frame',
    name: 'Chassis Frame',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'suspension_system',
    name: 'Suspension System',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'battery_compartment',
    name: 'Battery Compartment',
    category: CartPartCategory.MECHANICAL
  },
  {
    id: 'charging_port',
    name: 'Charging Port',
    category: CartPartCategory.MECHANICAL
  },
]

export const GOLF_CART_TYPES: CartTypeOption[] = [
  {
    value: '4seaters',
    name: '4 Seaters'
  },
  {
    value: '6seaters',
    name: '6 Seaters'
  }
]

export const DAMAGE_TYPES: DamageType[] = [
  {
    value: 'scratches',
    name: 'Scratches'
  },
  {
    value: 'missing_parts',
    name: 'Missing Parts'
  },
  {
    value: 'damage_bumps',
    name: 'Damage Bumps'
  }
]

export const PROPERTIES: CartProperty[] = [
  {
    id: 'cart_type',
    name: 'Cart Type',
    type: 'select',
    required: true
  },
  {
    id: 'atl_g7_casa_prestige',
    name: 'Atl. G7 Casa Prestige',
    type: 'string',
    required: false
  },
  {
    id: 'est_24_casa_paraiso',
    name: 'Est. 24 Casa Paraiso',
    type: 'string',
    required: false
  },
  {
    id: '3325_villa_clara',
    name: '3325 Villa Clara',
    type: 'string',
    required: false
  },
  {
    id: '7256_villa_palacio',
    name: '7256 Villa Palacio',
    type: 'string',
    required: false
  },
  {
    id: '10180_villa_flora',
    name: '10180 Villa Flora',
    type: 'string',
    required: false
  },
  {
    id: '5138_villa_paloma',
    name: '5138 Villa Paloma',
    type: 'string',
    required: false
  },
  {
    id: 'temporal',
    name: 'Temporal',
    type: 'string',
    required: false
  },
  {
    id: '2_102_villa_ocean_bliss',
    name: '2-102 Villa Ocean Bliss',
    type: 'string',
    required: false
  },
  {
    id: '10389_villa_tiffany',
    name: '10389 Villa Tiffany',
    type: 'string',
    required: false
  },
  {
    id: '2_208_ocean_haven_villa',
    name: '2-208 Ocean Haven Villa',
    type: 'string',
    required: false
  }
]

export const CART_TYPE_OPTIONS = GOLF_CART_TYPES
export const PROPERTY_OPTIONS = PROPERTIES