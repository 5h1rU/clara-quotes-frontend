import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuote } from '../QuoteContext';
import type { Condition, CoverageType } from '../types';
import { coverageOptions, conditionOptions, estimatePremium, money } from '../pricing';
import { StepHeading } from '../components/StepHeading';
import { ErrorNotice } from '../components/ErrorNotice';
import { YesNoField } from '../components/YesNoField';
import { ApiError } from '../api';
interface FormValues {
  coverageType: CoverageType;
  hasPreexistingConditions?: boolean;
  conditions: Condition[];
  takesPrescriptionMedication?: boolean;
  usesTobacco?: boolean;
  needsSpouseCoverage?: boolean;
}
function coverageSchema(senior: boolean): yup.ObjectSchema<FormValues> {
  const answer = () =>
    senior ? yup.boolean().required('Choose Yes or No.') : yup.boolean().optional();
  return yup.object({
    coverageType: yup.mixed<CoverageType>().oneOf(['BASIC', 'STANDARD', 'PREMIUM']).required(),
    hasPreexistingConditions: answer(),
    conditions: yup
      .array(
        yup
          .mixed<Condition>()
          .oneOf(conditionOptions.map((c) => c.value))
          .required(),
      )
      .required()
      .when('hasPreexistingConditions', {
        is: true,
        then: (s) => (senior ? s.min(1, 'Select at least one condition.') : s),
      }),
    takesPrescriptionMedication: answer(),
    usesTobacco: answer(),
    needsSpouseCoverage: answer(),
  });
}
export function CoverageStep() {
  const { quote, saveCoverage } = useQuote();
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  const senior = (quote?.age ?? 0) > 65;
  const {
    control,
    handleSubmit,
    setValue,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(coverageSchema(senior)),
    defaultValues: {
      coverageType: quote?.coverageType ?? 'BASIC',
      hasPreexistingConditions: quote?.hasPreexistingConditions ?? undefined,
      conditions: quote?.conditions ?? [],
      takesPrescriptionMedication: quote?.takesPrescriptionMedication ?? undefined,
      usesTobacco: quote?.usesTobacco ?? undefined,
      needsSpouseCoverage: quote?.needsSpouseCoverage ?? undefined,
    },
  });
  const values = useWatch({ control });
  if (!quote) return <Navigate to="/personal" replace />;
  if (quote.status === 'SUBMITTED' || quote.status === 'EXPIRED')
    return <Navigate to="/summary" replace />;
  const premium = estimatePremium(values.coverageType ?? 'BASIC', quote.age, values);
  return (
    <>
      <StepHeading
        step="STEP 02 / COVERAGE"
        title="Find your fit."
        description="Choose a coverage level and see your monthly estimate."
      />
      <ErrorNotice error={error} />
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(async (data) => {
          setError(null);
          try {
            await saveCoverage(senior ? data : { coverageType: data.coverageType });
            navigate('/summary');
          } catch (e) {
            setError(e);
            if (e instanceof ApiError)
              for (const [field, message] of Object.entries(e.fieldErrors))
                if (field in data) setFieldError(field as keyof FormValues, { message });
          }
        })}
      >
        <Controller
          name="coverageType"
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} aria-label="Coverage type" className="coverage-options">
              {coverageOptions.map((option) => (
                <Box
                  key={option.value}
                  className={`coverage-option ${field.value === option.value ? 'selected' : ''}`}
                >
                  <FormControlLabel
                    value={option.value}
                    control={<Radio />}
                    label={
                      <>
                        <Typography component="span" sx={{ fontWeight: 700 }}>
                          {option.label}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ display: 'block' }}
                          color="text.secondary"
                        >
                          From {money(option.base)} / mo
                        </Typography>
                      </>
                    }
                  />
                </Box>
              ))}
            </RadioGroup>
          )}
        />
        {senior && (
          <Box className="health-section">
            <Chip label="For applicants over 65" size="small" sx={{ mb: 2 }} />
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
              A few health details
            </Typography>
            <Controller
              name="hasPreexistingConditions"
              control={control}
              render={({ field }) => (
                <YesNoField
                  {...field}
                  label="Any pre-existing conditions?"
                  error={errors.hasPreexistingConditions?.message}
                  onChange={(value) => {
                    field.onChange(value);
                    if (!value) setValue('conditions', []);
                  }}
                />
              )}
            />
            {values.hasPreexistingConditions && (
              <Controller
                name="conditions"
                control={control}
                render={({ field }) => (
                  <FormControl component="fieldset" error={!!errors.conditions} sx={{ mb: 3 }}>
                    <Typography component="legend" variant="body2">
                      Select all that apply
                    </Typography>
                    {conditionOptions.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        label={option.label}
                        control={
                          <Checkbox
                            checked={field.value.includes(option.value)}
                            onChange={(_, checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, option.value]
                                  : field.value.filter((value) => value !== option.value),
                              )
                            }
                          />
                        }
                      />
                    ))}
                    {errors.conditions && (
                      <FormHelperText>{errors.conditions.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            )}
            <Controller
              name="takesPrescriptionMedication"
              control={control}
              render={({ field }) => (
                <YesNoField
                  {...field}
                  label="Do you take prescription medication?"
                  error={errors.takesPrescriptionMedication?.message}
                />
              )}
            />
            <Controller
              name="usesTobacco"
              control={control}
              render={({ field }) => (
                <YesNoField
                  {...field}
                  label="Do you use tobacco?"
                  error={errors.usesTobacco?.message}
                />
              )}
            />
            <Controller
              name="needsSpouseCoverage"
              control={control}
              render={({ field }) => (
                <YesNoField
                  {...field}
                  label="Include coverage for your spouse?"
                  error={errors.needsSpouseCoverage?.message}
                />
              )}
            />
          </Box>
        )}
        <Box className="premium-preview" role="status" aria-live="polite">
          <div>
            <Typography variant="body2">Estimated monthly premium</Typography>
            <Typography variant="h3" component="p">
              {money(premium)}
              <Typography component="span" variant="body2">
                {' '}
                / month
              </Typography>
            </Typography>
          </div>
          <Typography variant="caption">USD · Confirmed when you continue</Typography>
        </Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, mt: 4 }}>
          <Button onClick={() => navigate('/personal')} disabled={isSubmitting}>
            Back
          </Button>
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Review quote'}
          </Button>
        </Stack>
      </Box>
    </>
  );
}
