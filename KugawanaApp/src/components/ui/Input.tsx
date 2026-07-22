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
            style={[styles.input, error != null && styles.inputError]}
            value={value == null ? '' : String(value)}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={colors.textMuted}
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
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.textPrimary,
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
