type Props = { value: string; onChange: (value: string) => void };

export function OtpInput({ value, onChange }: Props) {
  return (
    <label className="otp-field">
      <span className="visually-hidden">Verification code</span>
      <input
        className="otp-input"
        name="otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        required
      />
      <span className="otp-slots" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className={`otp-slot${index === Math.min(value.length, 5) ? " active" : ""}`}>{value[index]}</span>
        ))}
      </span>
    </label>
  );
}
