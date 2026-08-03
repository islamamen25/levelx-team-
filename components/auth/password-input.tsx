"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * A password field with a show/hide toggle.
 *
 * Works both uncontrolled (the login page posts to a Server Action, so the field
 * just needs a `name`) and controlled (the reset form tracks its own state), which
 * is why `value`/`onChange` are optional pass-throughs rather than required props.
 *
 * The toggle is `type="button"` on purpose — inside a <form> a bare <button>
 * defaults to submit, so without it, revealing the password would post the form.
 */
interface Props {
  id: string;
  name?: string;
  locale: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PasswordInput({ id, name, locale, ...rest }: Props) {
  const [shown, setShown] = useState(false);
  const hintId = useId();
  const isAr = locale === "ar";

  return (
    <div className="relative">
      <input
        {...rest}
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        aria-describedby={hintId}
        // pe- (padding-inline-end) not pr-: the toggle sits on the trailing edge,
        // which is the LEFT side in Arabic. A physical pr- would put the padding
        // on the wrong side of the RTL field and the text would run under the icon.
        className="w-full rounded-xl border border-[var(--color-iron)] px-4 pe-11 py-2.5 text-sm text-[var(--color-ceramic)] focus:border-[var(--color-mint)] focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        // A true 44x44 hit area — the site-wide minimum; a 16px icon alone is not
        // tappable. Centred with translate rather than stretched with inset-y-0:
        // the field is only ~41px tall, so inset-y-0 would have silently produced
        // a 44x41 button that fails the target-size check by 3px. It overhangs the
        // field by ~1.5px top and bottom, which is invisible on a transparent button.
        className="absolute end-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[var(--color-slate)] transition-colors hover:text-[var(--color-ceramic)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-mint)]"
        aria-label={
          shown
            ? isAr ? "إخفاء كلمة المرور" : "Hide password"
            : isAr ? "إظهار كلمة المرور" : "Show password"
        }
        aria-pressed={shown}
        // Keep it out of the tab order between the field and the submit button:
        // someone typing a password and pressing Tab expects to reach Submit.
        tabIndex={-1}
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <span id={hintId} className="sr-only">
        {shown
          ? isAr ? "كلمة المرور ظاهرة حالياً" : "Password is currently visible"
          : isAr ? "كلمة المرور مخفية" : "Password is hidden"}
      </span>
    </div>
  );
}
