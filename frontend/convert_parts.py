import re
import json

def clean_part_name(part):
    # Eliminar números al inicio
    part = re.sub(r'^\d+\s*', '', part.strip())
    return part

def categorize_part(part):
    exterior_parts = [
        'Front Bumper', 'Rear Bumper', 'Left Front Fender', 'Right Front Fender', 
        'Left Rear Fender', 'Right Rear Fender', 'Left Side Panel', 'Right Side Panel', 
        'Roof', 'Windshield', 'Left Mirror', 'Right Mirror', 'Front Lights', 'Rear Lights', 
        'Left Door (if applicable)', 'Right Door (if applicable)', 'Roof Supports (Front & Rear)', 
        'Grab Handles', 'Rear Cargo Rack / Rear Step', 'Roof Brackets', 'Side Grab Bars', 
        'Rear Safety Bar'
    ]
    
    seat_parts = [
        'Front Row - Driver Seat Cushion', 'Front Row - Driver Seat Backrest', 
        'Front Row - Passenger Seat Cushion', 'Front Row - Passenger Seat Backrest', 
        'Middle Row - Left Seat Cushion', 'Middle Row - Left Seat Backrest', 
        'Middle Row - Right Seat Cushion', 'Middle Row - Right Seat Backrest', 
        'Rear Row - Left Seat Cushion', 'Rear Row - Left Seat Backrest', 
        'Rear Row - Right Seat Cushion', 'Rear Row - Right Seat Backrest'
    ]
    
    interior_parts = [
        'Steering Wheel', 'Dashboard', 'Pedals', 'Speedometer (if applicable)', 
        'Ignition Switch / Key Slot', 'Horn Button'
    ]
    
    mechanical_parts = [
        'Left Front Wheel Rim', 'Right Front Wheel Rim', 'Left Rear Wheel Rim', 
        'Right Rear Wheel Rim', 'Left Front Tire', 'Right Front Tire', 
        'Left Rear Tire', 'Right Rear Tire', 'Chassis Frame', 'Suspension System', 
        'Battery Compartment', 'Charging Port'
    ]
    
    cleaned_part = clean_part_name(part)
    
    if cleaned_part in exterior_parts:
        return 'Exterior'
    elif cleaned_part in seat_parts:
        return 'Seats'
    elif cleaned_part in interior_parts:
        return 'Interior'
    elif cleaned_part in mechanical_parts:
        return 'Mechanical'
    else:
        return 'Other'

def convert_parts(parts_list):
    cart_parts = []
    for part in parts_list:
        part = part.strip()
        if part and not part.isdigit():
            # Limpiar el nombre de la parte
            cleaned_part = clean_part_name(part)
            
            # Convertir parte a un identificador válido
            identifier = re.sub(r'[^a-zA-Z0-9_]', '_', cleaned_part.lower())
            cart_part = {
                'id': identifier,
                'name': cleaned_part,
                'value': cleaned_part,
                'category': categorize_part(part)
            }
            cart_parts.append(cart_part)
    
    return cart_parts

parts_input = """1 Front Bumper
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
Charging Port"""

parts_list = parts_input.split('\n')
cart_parts = convert_parts(parts_list)

# Generate TypeScript code
ts_code = "import { CartPart, CartTypeOption, CartProperty, DamageType } from '@/types'\n\n"

# CART_PARTS
ts_code += "export const CART_PARTS: CartPart[] = [\n"
for part in cart_parts:
    ts_code += f"  {{\n"
    ts_code += f"    id: '{part['id']}',\n"
    ts_code += f"    name: '{part['name']}',\n"
    ts_code += f"    value: '{part['value']}',\n"
    ts_code += f"    category: '{part['category']}'\n"
    ts_code += f"  }},\n"
ts_code += "]\n\n"

# GOLF_CART_TYPES
ts_code += "export const GOLF_CART_TYPES: CartTypeOption[] = [\n"
ts_code += "  { id: '4seaters', name: '4 Seaters', value: '4 Seaters', diagramPath: 'assets/images/4seaters.png' },\n"
ts_code += "  { id: '6seaters', name: '6 Seaters', value: '6 Seaters', diagramPath: 'assets/images/6seaters.png' }\n"
ts_code += "]\n\n"

# PROPERTIES
ts_code += "export const PROPERTIES: CartProperty[] = [\n"
ts_code += "  { id: 'atl_g7_casa_prestige', name: 'Atl. G7 Casa Prestige', type: 'string', required: false },\n"
ts_code += "  { id: 'est_24_casa_paraiso', name: 'Est. 24 Casa Paraiso', type: 'string', required: false },\n"
ts_code += "  { id: '3325_villa_clara', name: '3325 Villa Clara', type: 'string', required: false },\n"
ts_code += "  { id: '7256_villa_palacio', name: '7256 Villa Palacio', type: 'string', required: false },\n"
ts_code += "  { id: '10180_villa_flora', name: '10180 Villa Flora', type: 'string', required: false },\n"
ts_code += "  { id: '5138_villa_paloma', name: '5138 Villa Paloma', type: 'string', required: false },\n"
ts_code += "  { id: 'temporal', name: 'Temporal', type: 'string', required: false },\n"
ts_code += "  { id: '2_102_villa_ocean_bliss', name: '2-102 Villa Ocean Bliss', type: 'string', required: false },\n"
ts_code += "  { id: '10389_villa_tiffany', name: '10389 Villa Tiffany', type: 'string', required: false },\n"
ts_code += "  { id: '2_208_ocean_haven_villa', name: '2-208 Ocean Haven Villa', type: 'string', required: false }\n"
ts_code += "]\n\n"

# DAMAGE_TYPES
ts_code += "export const DAMAGE_TYPES: DamageType[] = [\n"
ts_code += "  { id: 'scratches', name: 'Scratches', severity: 'Low' },\n"
ts_code += "  { id: 'missing_parts', name: 'Missing Parts', severity: 'Critical' },\n"
ts_code += "  { id: 'damage_bumps', name: 'Damage/Bumps', severity: 'Medium' }\n"
ts_code += "]"

# Write to constants.ts
with open('/Users/cvilla/Desktop/golf-cart-inspection/frontend/src/constants.ts', 'w') as f:
    f.write(ts_code)

print("Conversion complete. Check constants.ts for the result.")
