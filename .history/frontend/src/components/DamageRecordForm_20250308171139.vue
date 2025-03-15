<template>
  <div class="add-damage-form q-pa-md bg-grey-2 rounded-borders">
    <div class="row q-col-gutter-sm items-center">
      <div class="col-12 col-sm">
        <q-select
          v-model="damage.part"
          :options="cartParts"
          label="Cart Part *"
          outlined
          dense
          emit-value
          map-options
          :rules="[val => !!val || 'Part is required']"
        />
      </div>
      
      <div class="col-12 col-sm">
        <q-select
          v-model="damage.type"
          :options="damageTypes"
          label="Damage Type *"
          outlined
          dense
          emit-value
          map-options
          :rules="[val => !!val || 'Type is required']"
        />
      </div>
      
      <div class="col-12 col-sm-2">
        <q-input
          v-model="damage.quantity"
          type="number"
          label="Quantity *"
          outlined
          dense
          min="1"
          :rules="[val => val > 0 || 'Quantity must be greater than 0']"
        />
      </div>
      
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Add"
          @click="addDamage"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'DamageRecordForm',
  
  props: {
    cartParts: {
      type: Array,
      default: () => [
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
        { label: '15. Left Door', value: 'left_door' },
        { label: '16. Right Door', value: 'right_door' },
        { label: '17. Front Row - Driver Seat Cushion', value: 'front_driver_seat_cushion' },
        { label: '18. Front Row - Driver Seat Backrest', value: 'front_driver_seat_backrest' },
        { label: '19. Front Row - Passenger Seat Cushion', value: 'front_passenger_seat_cushion' },
        { label: '20. Front Row - Passenger Seat Backrest', value: 'front_passenger_seat_backrest' },
        { label: '21. Middle Row - Left Seat Cushion', value: 'middle_left_seat_cushion' },
        { label: '22. Middle Row - Left Seat Backrest', value: 'middle_left_seat_backrest' },
        { label: '23. Middle Row - Right Seat Cushion', value: 'middle_right_seat_cushion' },
        { label: '24. Middle Row - Right Seat Backrest', value: 'middle_right_seat_backrest' },
        { label: '25. Rear Row - Left Seat Cushion', value: 'rear_left_seat_cushion' },
        { label: '26. Rear Row - Left Seat Backrest', value: 'rear_left_seat_backrest' },
        { label: '27. Rear Row - Right Seat Cushion', value: 'rear_right_seat_cushion' },
        { label: '28. Rear Row - Right Seat Backrest', value: 'rear_right_seat_backrest' },
        { label: '29. Steering Wheel', value: 'steering_wheel' },
        { label: '30. Dashboard', value: 'dashboard' },
        { label: '31. Pedals', value: 'pedals' },
        { label: '32. Left Front Wheel Rim', value: 'left_front_wheel_rim' },
        { label: '33. Right Front Wheel Rim', value: 'right_front_wheel_rim' },
        { label: '34. Left Rear Wheel Rim', value: 'left_rear_wheel_rim' },
        { label: '35. Right Rear Wheel Rim', value: 'right_rear_wheel_rim' },
        { label: '36. Left Front Tire', value: 'left_front_tire' },
        { label: '37. Right Front Tire', value: 'right_front_tire' },
        { label: '38. Left Rear Tire', value: 'left_rear_tire' },
        { label: '39. Right Rear Tire', value: 'right_rear_tire' },
        { label: '40. Tubular Bars (Steel/Aluminum)', value: 'tubular_bars' }
      ]
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
  
  emits: ['add'],
  
  setup(props, { emit }) {
    const damage = ref({
      part: null,
      type: null,
      quantity: 1
    })
    
    const addDamage = () => {
      if (damage.value.part && 
          damage.value.type && 
          damage.value.quantity > 0) {
        
        const newDamage = {...damage.value}
        emit('add', newDamage)
        
        // Resetear el formulario
        damage.value = {
          part: null,
          type: null,
          quantity: 1
        }
      } else {
        // Opcional: Mostrar mensaje de error
        console.warn('Invalid damage data:', damage.value)
      }
    }
    
    return {
      damage,
      addDamage
    }
  }
}
</script>

<style scoped>
.add-damage-form {
  border: 1px solid #e0e0e0;
}
</style>
