import {
  Calendar,
  DateField,
  DatePicker,
  DateRangePicker,
  FieldError,
  Label,
  RangeCalendar,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";

type DateRange = { start: DateValue; end: DateValue };

interface AppDateBaseProp {
  name: string;
  label: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  description?: string;
  errorMessage?: string;
}

interface AppDateSingleProps extends AppDateBaseProp {
  mode?: "single";
  value: DateValue | null;
  onChange: (value: DateValue | null) => void;
}

interface AppDateRangeProps extends AppDateBaseProp {
  mode: "range";
  value: DateRange | null;
  onChange: (value: DateRange | null) => void;
  startName?: string;
  endName?: string;
}

type AppDateProps = AppDateSingleProps | AppDateRangeProps;

export default function AppDate(props: AppDateProps) {
  const {
    label,
    isRequired = false,
    isDisabled = false,
    className = "w-full",
    description,
    errorMessage,
  } = props;

  if (props.mode === "range") {
    return (
      <DateRangePicker
        startName={props.startName ?? props.name + "_start"}
        endName={props.endName ?? props.name + "_end"}
        isRequired={isRequired}
        isDisabled={isDisabled}
        className={className}
        value={props.value}
        onChange={props.onChange}
      >
        <Label>{label}</Label>
        <DateField.Group fullWidth>
          <DateField.Input slot="start">
            {(seg) => <DateField.Segment segment={seg} />}
          </DateField.Input>
          <DateRangePicker.RangeSeparator />
          <DateField.Input slot="end">
            {(seg) => <DateField.Segment segment={seg} />}
          </DateField.Input>
          <DateField.Suffix>
            <DateRangePicker.Trigger>
              <DateRangePicker.TriggerIndicator />
            </DateRangePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        {description ? (
          <p className="mt-1 text-xs text-(--foreground-500)">{description}</p>
        ) : null}
        <FieldError>{errorMessage}</FieldError>
        <DateRangePicker.Popover>
          <RangeCalendar aria-label={label}>
            <RangeCalendar.Header>
              <RangeCalendar.YearPickerTrigger>
                <RangeCalendar.YearPickerTriggerHeading />
                <RangeCalendar.YearPickerTriggerIndicator />
              </RangeCalendar.YearPickerTrigger>
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
            <RangeCalendar.YearPickerGrid>
              <RangeCalendar.YearPickerGridBody>
                {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
              </RangeCalendar.YearPickerGridBody>
            </RangeCalendar.YearPickerGrid>
          </RangeCalendar>
        </DateRangePicker.Popover>
      </DateRangePicker>
    );
  }

  return (
    <DatePicker
      name={props.name}
      isRequired={isRequired}
      isDisabled={isDisabled}
      className={className}
      value={props.value}
      onChange={props.onChange}
    >
      <Label>{label}</Label>
      <DateField.Group fullWidth>
        <DateField.Input>
          {(seg) => <DateField.Segment segment={seg} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {description ? (
        <p className="mt-1 text-xs text-(--foreground-500)">{description}</p>
      ) : null}
      <FieldError>{errorMessage}</FieldError>
      <DatePicker.Popover>
        <Calendar aria-label={label}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => <Calendar.YearPickerCell year={year} />}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}
