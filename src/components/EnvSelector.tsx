interface EnvSelectorProps {
  onChange: (env: "dev" | "prod") => void;
  currentEnv: "dev" | "prod";
}

export function EnvSelector({ onChange, currentEnv }: EnvSelectorProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-slate-100 px-4 py-2">
      <span className="text-sm font-medium text-slate-600">Base de datos:</span>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="radio"
          name="env"
          value="dev"
          checked={currentEnv === "dev"}
          onChange={() => onChange("dev")}
          className="text-blue-600"
        />
        <span
          className={`text-sm ${currentEnv === "dev" ? "font-semibold text-blue-600" : "text-slate-600"}`}
        >
          Dev
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="radio"
          name="env"
          value="prod"
          checked={currentEnv === "prod"}
          onChange={() => onChange("prod")}
          className="text-red-600"
        />
        <span
          className={`text-sm ${currentEnv === "prod" ? "font-semibold text-red-600" : "text-slate-600"}`}
        >
          Prod
        </span>
      </label>
      {currentEnv === "prod" && (
        <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
          ⚠️ PRODUCCIÓN
        </span>
      )}
    </div>
  );
}
