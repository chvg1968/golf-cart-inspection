<template>
  <div v-if="modelValue.length > 0" class="damage-records q-mb-md">
    <q-markup-table flat bordered>
      <thead>
        <tr>
          <th class="text-left">Part</th>
          <th class="text-left">Type</th>
          <th class="text-center">Quantity</th>
          <th class="text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(damage, index) in modelValue" :key="index">
          <td>{{ getPartLabel(damage.part) }}</td>
          <td>{{ getDamageTypeLabel(damage.type) }}</td>
          <td class="text-center">{{ damage.quantity }}</td>
          <td class="text-center">
            <q-btn
              flat
              round
              dense
              color="negative"
              icon="delete"
              @click="removeDamage(index)"
            />
          </td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script>
export const CART_PARTS = [
  { label: '1. Front Bumper', value: 'front_bumper' },
  { label: '2. Rear Bumper', value: 'rear_bumper' },
  { label: '3. Left Front Fender', value: 'left_front_fender' },
  { label: '4. Right Front Fender', value: 'right_front_fender' },
  { label: '5. Left Rear Fender', value: 'left_rear_fender' },
  { label: '6. Right Rear Fender', value: 'right_rear_fender' },
  { label: '7. Left Side Panel', value: 'left_side_panel' },
  { label: '8. Right Side Panel', value: 'right_side_panel' },
  { label: '9. Roof', value: 'roof' },
  { label: '10. Windshield', value: 'windshield' },
  { label: '11. Left Mirror', value: 'left_mirror' },
  { label: '12. Right Mirror', value: 'right_mirror' },
  { label: '13. Front Lights', value: 'front_lights' },
  { label: '14. Rear Lights', value: 'rear_lights' },
  { label: '15. Left Door (if applicable)', value: 'left_door' },
  { label: '16. Right Door (if applicable)', value: 'right_door' },
  { label: '17. Roof Supports (Front & Rear)', value: 'roof_supports' },
  { label: '18. Grab Handles', value: 'grab_handles' },
  { label: '19. Rear Cargo Rack / Rear Step', value: 'rear_cargo_rack' },
  { label: '20. Roof Brackets', value: 'roof_brackets' },
  { label: '21. Front Row - Driver Seat Cushion', value: 'front_driver_seat_cushion' },
  { label: '22. Front Row - Driver Seat Backrest', value: 'front_driver_seat_backrest' },
  { label: '23. Front Row - Passenger Seat Cushion', value: 'front_passenger_seat_cushion' },
  { label: '24. Front Row - Passenger Seat Backrest', value: 'front_passenger_seat_backrest' },
  { label: '25. Middle Row - Left Seat Cushion', value: 'middle_left_seat_cushion' },
  { label: '26. Middle Row - Left Seat Backrest', value: 'middle_left_seat_backrest' },
  { label: '27. Middle Row - Right Seat Cushion', value: 'middle_right_seat_cushion' },
  { label: '28. Middle Row - Right Seat Backrest', value: 'middle_right_seat_backrest' },
  { label: '29. Rear Row - Left Seat Cushion', value: 'rear_left_seat_cushion' },
  { label: '30. Rear Row - Left Seat Backrest', value: 'rear_left_seat_backrest' },
  { label: '31. Rear Row - Right Seat Cushion', value: 'rear_right_seat_cushion' },
  { label: '32. Rear Row - Right Seat Backrest', value: 'rear_right_seat_backrest' },
  { label: '33. Steering Wheel', value: 'steering_wheel' },
  { label: '34. Dashboard', value: 'dashboard' },
  { label: '35. Pedals', value: 'pedals' },
  { label: '36. Speedometer (if applicable)', value: 'speedometer' },
  { label: '37. Ignition Switch / Key Slot', value: 'ignition_switch' },
  { label: '38. Horn Button', value: 'horn_button' },
  { label: '39. Left Front Wheel Rim', value: 'left_front_wheel_rim' },
  { label: '40. Right Front Wheel Rim', value: 'right_front_wheel_rim' },
  { label: '41. Left Rear Wheel Rim', value: 'left_rear_wheel_rim' },
  { label: '42. Right Rear Wheel Rim', value: 'right_rear_wheel_rim' },
  { label: '43. Left Front Tire', value: 'left_front_tire' },
  { label: '44. Right Front Tire', value: 'right_front_tire' },
  { label: '45. Left Rear Tire', value: 'left_rear_tire' },
  { label: '46. Right Rear Tire', value: 'right_rear_tire' },
  { label: '47. Side Grab Bars', value: 'side_grab_bars' },
  { label: '48. Rear Safety Bar', value: 'rear_safety_bar' },
  { label: '49. Chassis Frame', value: 'chassis_frame' },
  { label: '50. Suspension System', value: 'suspension_system' },
  { label: '51. Battery Compartment', value: 'battery_compartment' },
  { label: '52. Charging Port', value: 'charging_port' }
]

export default {
  name: 'DamageRecordList',
  
  props: {
    modelValue: {
      type: Array,
      required: true
    },
    cartParts: {
      type: Array,
      default: () => CART_PARTS
    },
    damageTypes: {
      type: Array,
      default: () => [
        { label: 'Scratches', value: 'scratches' },
        { label: 'Missing Parts', value: 'missing_parts' },
        { label: 'Damages/Bumps', value: 'damages' }
      ]
    }
  },
  
  emits: ['update:modelValue', 'remove'],
  
  setup(props, { emit }) {
    const getPartLabel = (partValue) => {
      const part = props.cartParts.find(p => p.value === partValue)
      return part ? part.label : partValue
    }
    
    const getDamageTypeLabel = (typeValue) => {
      const type = props.damageTypes.find(t => t.value === typeValue)
      return type ? type.label : typeValue
    }
    
    const removeDamage = (index) => {
      const newDamages = [...props.modelValue]
      newDamages.splice(index, 1)
      emit('update:modelValue', newDamages)
      emit('remove', index)
    }
    
    return {
      removeDamage,
      getPartLabel,
      getDamageTypeLabel
    }
  }
}
</script>

<style scoped>
.damage-records {
  border-radius: 4px;
  overflow: hidden;
}

.damage-records .q-table__card {
  box-shadow: none;
}
</style>
