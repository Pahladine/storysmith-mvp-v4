export type WizardPersona = {
  name: string;
  title?: string;
  subtitle?: string;
};

export type WizardChoice<TValue = string> = {
  id: string;
  label: string;
  value: TValue;
  hint?: string;
};

export type WizardStepKind = "say" | "choice" | "text";

export type WizardStep<TState = any> =
  | {
      id: string;
      kind: "say";
      host: string;
      nextId: string;
    }
  | {
      id: string;
      kind: "choice";
      host: string;
      choices: WizardChoice[];
      apply: (state: TState, choice: WizardChoice) => TState;
      nextId: string | ((state: TState, choice: WizardChoice) => string);
      extraFlavor?: {
        label?: string;
        placeholder?: string;
        apply?: (state: TState, text: string) => TState;
      };
    }
  | {
      id: string;
      kind: "text";
      host: string;
      placeholder?: string;
      required?: boolean;
      apply: (state: TState, text: string) => TState;
      nextId: string;
    };

export type WizardScript<TState = any> = {
  persona: WizardPersona;
  initialStepId: string;
  steps: WizardStep<TState>[];
};

export type WizardMessage = {
  id: string;
  from: "host" | "user";
  text: string;
};