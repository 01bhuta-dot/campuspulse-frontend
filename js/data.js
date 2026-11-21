const KEY = "it-support-desk-demo-v1";

const STARTING_RECORDS = [
  {
    id: 1,
    title: "Eduroam Wi-Fi authentication failing in Engineering Block",
    category: "Network",
    description: "Students in Lecture Room E204 receive 'Unable to join network' after entering valid portal credentials.",
    status: "Pending"
  },
  {
    id: 2,
    title: "Install MATLAB R2024b on Computer Lab 2 workstations",
    category: "Software",
    description: "Need Simulink and Signal Processing toolboxes activated across all 30 desktop PCs before Monday labs.",
    status: "In progress"
  },
  {
    id: 3,
    title: "Main Library Circulation Desk receipt printer jammed",
    category: "Hardware",
    description: "Thermal printer displays a flashing red error LED and refuses to feed paper rolls.",
    status: "Completed"
  },
  {
    id: 4,
    title: "Lecturer laptop HDMI output flickering on Hall A projector",
    category: "Hardware",
    description: "Wall-mounted HDMI port drops video signal every few minutes during presentations.",
    status: "Pending"
  },
  {
    id: 5,
    title: "Reset locked student portal account for registration",
    category: "Account & Access",
    description: "Student account locked after multiple password attempts; multi-factor reset required.",
    status: "Completed"
  },
  {
    id: 6,
    title: "Ethernet wall jack dead at Admin Office Desk 4",
    category: "Network",
    description: "No link light detected on desktop NIC when patched into port B-14; switch port check needed.",
    status: "In progress"
  },
  {
    id: 7,
    title: "PostgreSQL service failing to start on Lab Server 01",
    category: "Software",
    description: "Database students cannot connect to port 5432; service throws a configuration permission error.",
    status: "Pending"
  },
  {
    id: 8,
    title: "Replace faulty USB keyboards in Science Lab B",
    category: "Lab Equipment",
    description: "Workstations B07 and B11 have unresponsive Enter and Spacebar keys.",
    status: "Completed"
  }
];

function initializeStorage() {
  // Seed starting records ONLY if the key has never been set
  if (localStorage.getItem(KEY) === null) {
    localStorage.setItem(KEY, JSON.stringify(STARTING_RECORDS));
  }
}

function readAll() {
  initializeStorage();
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export const recordService = {
  async list() {
    return readAll();
  },

  async get(id) {
    const numericId = Number(id);
    const records = readAll();
    const found = records.find((item) => item.id === numericId);
    if (!found) {
      throw new Error(`Support ticket #${numericId} was not found.`);
    }
    return { ...found };
  },

  async create(record) {
    const records = readAll();
    const maxId = records.reduce((max, item) => (item.id > max ? item.id : max), 0);
    const newRecord = {
      id: maxId + 1,
      title: record.title,
      category: record.category,
      description: record.description,
      status: record.status
    };
    records.push(newRecord);
    writeAll(records);
    return { ...newRecord };
  },

  async update(id, updatedFields) {
    const numericId = Number(id);
    const records = readAll();
    const index = records.findIndex((item) => item.id === numericId);
    if (index === -1) {
      throw new Error(`Cannot update: ticket #${numericId} no longer exists.`);
    }

    records[index] = {
      id: numericId,
      title: updatedFields.title,
      category: updatedFields.category,
      description: updatedFields.description,
      status: updatedFields.status
    };
    writeAll(records);
    return { ...records[index] };
  },

  async remove(id) {
    const numericId = Number(id);
    const records = readAll();
    const index = records.findIndex((item) => item.id === numericId);
    if (index === -1) {
      throw new Error(`Cannot delete: ticket #${numericId} was not found.`);
    }

    records.splice(index, 1);
    writeAll(records);
    return { message: `Ticket #${numericId} deleted successfully.` };
  }
};