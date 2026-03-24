function parseCommand(text) {
  const t = text.trim();

  // OWNER/MANAGER COMMANDS

  const assignMatch = t.match(
    /^assign\s+(.+?)\s+to\s+@(\S+)\s+on\s+(\S+)\s+at\s+(\S+(?:\s*[ap]m)?)\s*-\s*(.+?)\s*-\s*client\s+@(.+)/i
  );
  if (assignMatch) {
    return {
      type: "assign",
      job_type: assignMatch[1],
      worker_tag: assignMatch[2],
      date: assignMatch[3],
      time: assignMatch[4],
      address: assignMatch[5],
      customer_tag: assignMatch[6],
    };
  }

  const reassignMatch = t.match(/^reassign\s+(.+?)\s+to\s+@(\S+)/i);
  if (reassignMatch) {
    return { type: "reassign", job_ref: reassignMatch[1], worker_tag: reassignMatch[2] };
  }

  const cancelMatch = t.match(/^cancel\s+job\s+(.+)/i);
  if (cancelMatch) {
    return { type: "cancel", job_ref: cancelMatch[1] };
  }

  if (/^jobs\s+today$/i.test(t)) {
    return { type: "jobs_today" };
  }

  const jobsWorkerMatch = t.match(/^jobs\s+@(\S+)/i);
  if (jobsWorkerMatch) {
    return { type: "jobs_worker", worker_tag: jobsWorkerMatch[1] };
  }

  if (/^kpi\s+today$/i.test(t)) return { type: "kpi_today" };
  if (/^kpi\s+week$/i.test(t)) return { type: "kpi_week" };
  if (/^kpi\s+month$/i.test(t)) return { type: "kpi_month" };
  if (/^workers$/i.test(t)) return { type: "workers" };

  const customerLookupMatch = t.match(/^customer\s+@(.+)/i);
  if (customerLookupMatch) {
    return { type: "customer_lookup", customer_tag: customerLookupMatch[1] };
  }

  const invoiceLookupMatch = t.match(/^invoice\s+@(.+)/i);
  if (invoiceLookupMatch) {
    return { type: "invoice_lookup", customer_tag: invoiceLookupMatch[1] };
  }

  const addWorkerMatch = t.match(/^add\s+worker\s+(.+?)\s+(\+?[\d\s\-\(\)]{10,})/i);
  if (addWorkerMatch) {
    return { type: "add_worker", name: addWorkerMatch[1], phone: addWorkerMatch[2].trim() };
  }

  const addCustomerMatch = t.match(/^add\s+customer\s+(.+?)\s+(\+?[\d\s\-\(\)]{10,})\s+(.+)/i);
  if (addCustomerMatch) {
    return {
      type: "add_customer",
      name: addCustomerMatch[1],
      phone: addCustomerMatch[2].trim(),
      address: addCustomerMatch[3],
    };
  }

  const noteMatch = t.match(/^note\s+job\s+(\S+)\s+(.+)/i);
  if (noteMatch) {
    return { type: "note", job_ref: noteMatch[1], note_text: noteMatch[2] };
  }

  // WORKER COMMANDS

  if (/^start$/i.test(t)) return { type: "start", job_ref: null };
  const startMatch = t.match(/^start\s+(.+)/i);
  if (startMatch) return { type: "start", job_ref: startMatch[1] };

  if (/^done$/i.test(t)) return { type: "done", job_ref: null };
  const doneMatch = t.match(/^done\s+(.+)/i);
  if (doneMatch) return { type: "done", job_ref: doneMatch[1] };

  if (/^on\s+my\s+way$/i.test(t)) return { type: "on_my_way" };

  const issueMatch = t.match(/^issue\s+(.+)/i);
  if (issueMatch) return { type: "issue", description: issueMatch[1] };

  if (/^my\s+jobs$/i.test(t)) return { type: "my_jobs" };
  if (/^clock\s+in$/i.test(t)) return { type: "clock_in" };
  if (/^clock\s+out$/i.test(t)) return { type: "clock_out" };
  if (/^help$/i.test(t)) return { type: "help" };

  return { type: "unknown" };
}

module.exports = { parseCommand };
