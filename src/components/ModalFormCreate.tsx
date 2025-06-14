import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Swal from "sweetalert2";
import { DataClient } from "../types/dataClient";
import { useLists } from "../context/ListsContext";
import { urlBase } from "../globalConfig/config";
import { useAuth } from "../context/AuthContext";
import { json } from "react-router-dom";

interface ModalFormCreateProps {
  isOpen: boolean;
  onClose: () => void;
  refetch?: () => void;
}

type FormData = Omit<DataClient, 'clientId' | 'affiliationId' | 'govRegistryCompletedAt'> & {
  companyName: string;
  phones: string[];
  value: number; // Asegúrate de que value sea un número
  eps: string;
  arl: string;
  risk: string;
  ccf: string;
  pensionFund: string;
  observation: string;
  paid: "Pendiente" | "Pagado"; // Ajusta si tienes más estados
  datePaidReceived: string;
  govRegistryCompletedAt: string;
};

export default function ModalFormCreate({ isOpen, onClose, refetch }: ModalFormCreateProps) {
  const [loading, setLoading] = useState(false);
  const { lists, error, loading: loadingLists } = useLists();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    identification: "",
    companyName: "",
    value: 0,
    eps: "",
    arl: "",
    risk: "",
    ccf: "",
    pensionFund: "",
    observation: "",
    paid: "Pendiente",
    datePaidReceived: "",
    govRegistryCompletedAt: "",
    phones: [''], // Inicializamos phones como un array con un string vacío
  });

  const { user } = useAuth(); // Utiliza el hook useAuth para acceder al usuario

  useEffect(() => {
    if (error) {
      Swal.fire({
        title: "Error al cargar las listas",
        text: error,
        icon: "error",
      });
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user?.id) { // Verifica si el usuario y su ID existen
      Swal.fire({
        title: "Error de autenticación",
        text: "No se pudo obtener la información del usuario.",
        icon: "error",
      });
      return;
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se guardarán los datos del cliente y su primera afiliación.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Guardando...",
      text: "Por favor espera mientras se guardan los datos.",
      icon: "info",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      },
    });

    try {
      setLoading(true);
      const officeId = localStorage.getItem('selectedOffice');

      if (!officeId) {
        throw new Error("No se encontró el ID de la oficina.");
      }

      // Buscar los IDs correspondientes a los nombres seleccionados
      const selectedEps = lists!.eps.find(epsItem => epsItem.name === formData.eps);
      const selectedArl = lists!.arl.find(arlItem => arlItem.name === formData.arl);
      const selectedCcf = lists!.ccf.find(ccfItem => ccfItem.name === formData.ccf);
      const selectedPensionFund = lists!.pensionFunds.find(pfItem => pfItem.name === formData.pensionFund);
      const selectedCompany = lists!.companies.find(companyItem => companyItem.name === formData.companyName);

      const payload = {
        fullName: formData.fullName,
        identification: formData.identification,
        companyId: selectedCompany ? selectedCompany.id : null,
        phones: formData.phones,
        userId: user.id,
        officeId: officeId,
        affiliation: {
            value: Number(formData.value),
            epsId: selectedEps ? selectedEps.id : null,
            arlId: selectedArl ? selectedArl.id : null,
            ccfId: selectedCcf ? selectedCcf.id : null,
            pensionFundId: selectedPensionFund ? selectedPensionFund.id : null,
            risk: formData.risk,
            paid: formData.paid,
            observation: formData.observation,
            datePaidReceived: formData.datePaidReceived || null, // Asegúrate de que formData tenga este campo
            govRegistryCompletedAt: formData.govRegistryCompletedAt || null, // Asegúrate de que formData tenga este campo
        },
      };

      console.log('Payload enviado:', payload);

      const response = await fetch(`${urlBase}/clients-and-affiliations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar los datos del cliente y la afiliación, intentelo de nuevo más tarde");
      }

      Swal.fire({
        title: "¡Guardado!",
        text: "Los datos del cliente y su primera afiliación han sido guardados exitosamente.",
        icon: "success",
      });
      if (refetch) refetch();
      onClose();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error instanceof Error ? error.message : "Hubo un problema al guardar los datos.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
      if (!Swal.isVisible()) {
        Swal.close();
      }
    }
  };

  if (loadingLists) {
    return <div>Cargando listas...</div>;
  }

  if (!lists) {
    return <div>Error al cargar las listas.</div>;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-50"
          leave="ease-in duration-200"
          leaveFrom="opacity-50"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray bg-opacity-30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6 transition-all">
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                Crear nueva afiliación
              </Dialog.Title>

              <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-2 gap-4">
                {/* Seleccionar Empresa */}
                <div> {/* Este div ya existe, solo le agregamos el label */}
                  <label htmlFor="companyName" className="block text-gray-700 text-sm font-bold mb-1">
                    Empresa:
                  </label>
                  <select
                    id="companyName" // Agregado id para el label
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">Seleccionar Empresa</option>
                    {lists?.companies.map((companyItem) => (
                      <option key={companyItem.id} value={companyItem.name}>
                        {companyItem.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valor de afiliación */}
                <div> {/* Se envuelve el input en un div para el layout de cuadrícula */}
                  <label htmlFor="value" className="block text-gray-700 text-sm font-bold mb-1">
                    Valor de Afiliación:
                  </label>
                  <input
                    type="number"
                    id="value" // Agregado id para el label
                    name="value"
                    value={formData.value === 0 ? '' : formData.value}
                    onChange={handleChange}
                    placeholder="Ej: 150000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Nombre completo */}
                <div> {/* Se envuelve el input en un div */}
                  <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-1">
                    Nombre Completo:
                  </label>
                  <input
                    type="text"
                    id="fullName" // Agregado id para el label
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Identificación */}
                <div> {/* Se envuelve el input en un div */}
                  <label htmlFor="identification" className="block text-gray-700 text-sm font-bold mb-1">
                    Identificación:
                  </label>
                  <input
                    type="text"
                    id="identification" // Agregado id para el label
                    name="identification"
                    value={formData.identification}
                    onChange={handleChange}
                    placeholder="Ej: 123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Teléfono del afiliado */}
                <div> {/* Se envuelve el input en un div */}
                  <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-1">
                    Teléfono del Afiliado:
                  </label>
                  <input
                    type="tel"
                    id="phone" // Agregado id para el label
                    name="phones[0]"
                    value={formData.phones[0] || ''}
                    onChange={(e) => {
                      const { value } = e.target;
                      setFormData((prev) => ({
                        ...prev,
                        phones: [value, ...(prev.phones.slice(1))],
                      }));
                    }}
                    placeholder="Ej: 3001234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Seleccionar EPS */}
                <div> {/* Se envuelve el select en un div */}
                  <label htmlFor="eps" className="block text-gray-700 text-sm font-bold mb-1">
                    EPS:
                  </label>
                  <select
                    id="eps" // Agregado id para el label
                    name="eps"
                    value={formData.eps}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccionar EPS</option>
                    {lists?.eps.map((epsItem) => (
                      <option key={epsItem.id} value={epsItem.name}>
                        {epsItem.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seleccionar ARL (Opcional) */}
                <div> {/* Se envuelve el select en un div */}
                  <label htmlFor="arl" className="block text-gray-700 text-sm font-bold mb-1">
                    ARL (Opcional):
                  </label>
                  <select
                    id="arl" // Agregado id para el label
                    name="arl"
                    value={formData.arl}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccionar ARL (Opcional)</option>
                    {lists?.arl.map((arlItem) => (
                      <option key={arlItem.id} value={arlItem.name}>
                        {arlItem.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seleccionar Nivel de Riesgo */}
                <div> {/* Se envuelve el select en un div */}
                  <label htmlFor="risk" className="block text-gray-700 text-sm font-bold mb-1">
                    Nivel de Riesgo:
                  </label>
                  <select
                    id="risk" // Agregado id para el label
                    name="risk"
                    value={formData.risk}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccionar Nivel de Riesgo</option>
                    <option value="Nivel I">Nivel 1</option>
                    <option value="Nivel II">Nivel 2</option>
                    <option value="Nivel III">Nivel 3</option>
                    <option value="Nivel IV">Nivel 4</option>
                    <option value="Nivel V">Nivel 5</option>
                  </select>
                </div>

                {/* Seleccionar CCF (Opcional) */}
                <div> {/* Se envuelve el select en un div */}
                  <label htmlFor="ccf" className="block text-gray-700 text-sm font-bold mb-1">
                    CCF (Opcional):
                  </label>
                  <select
                    id="ccf" // Agregado id para el label
                    name="ccf"
                    value={formData.ccf}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccionar CCF (Opcional)</option>
                    {lists?.ccf.map((ccfItem) => (
                      <option key={ccfItem.id} value={ccfItem.name}>
                        {ccfItem.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seleccionar Fondo de Pensión (Opcional) */}
                <div> {/* Se envuelve el select en un div */}
                  <label htmlFor="pensionFund" className="block text-gray-700 text-sm font-bold mb-1">
                    Fondo de Pensión (Opcional):
                  </label>
                  <select
                    id="pensionFund" // Agregado id para el label
                    name="pensionFund"
                    value={formData.pensionFund}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccionar Fondo de Pensión (Opcional)</option>
                    {lists?.pensionFunds.map((pfItem) => (
                      <option key={pfItem.id} value={pfItem.name}>
                        {pfItem.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Observaciones */}
                <div className="col-span-2"> {/* Ocupa 2 columnas */}
                  <label htmlFor="observation" className="block text-gray-700 text-sm font-bold mb-1">
                    Observaciones:
                  </label>
                  <textarea
                    id="observation" // Agregado id para el label
                    name="observation"
                    value={formData.observation}
                    onChange={handleChange}
                    placeholder="Añade cualquier observación relevante aquí..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>       

                <div className="col-span-2 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 focus:ring-2 focus:ring-red-400 transition duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 focus:ring-2 focus:ring-green-400 transition duration-300"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}