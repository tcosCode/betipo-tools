import Swal from "sweetalert2";

export const confirmProductionEnv = async (text: string) => {
  const result = await Swal.fire({
    title: "¿Cambiar a PRODUCCIÓN?",
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Sí, cambiar",
    cancelButtonText: "Cancelar",
  });

  return result.isConfirmed;
};
