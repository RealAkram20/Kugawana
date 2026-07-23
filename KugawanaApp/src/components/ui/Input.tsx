import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

interface InputProps<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>
  name: Path<T>
  label: string
  rules?: Omit<RegisterOptions<T, Path<T>>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'>
}

export function Input<T extends FieldValues>({ control, name, label, rules, ...inputProps }: InputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={styles.wrap}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[
              styles.input,
              inputProps.multiline === true && styles.multiline,
              error != null && styles.inputError,
            ]}
            value={value == null ? '' : String(value)}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={colors.textMuted}
            textAlignVertical={inputProps.multiline === true ? 'top' : 'auto'}
            {...inputProps}
          />
          {error?.message ? <Text style={styles.error}>{error.message}</Text> : null}
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.textPrimary,
  },
  multiline: {
    minHeight: 110,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
})
