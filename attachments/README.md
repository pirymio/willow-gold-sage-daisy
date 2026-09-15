# RT-LCA / LCC Process Dashboard — modular layout (9 files)

Run from this folder, or add it to the MATLAB path:   `lca_process_dashboard`

Every module is one file that groups the functions of one phase of the framework and exposes
them with the same call form:   `rtlca_<module>('functionName', arguments...)`.
Inside a module, functions call each other directly; across modules they use that form.

| File | Role | Main functions |
|---|---|---|
| `lca_process_dashboard.m` | entry point | creates the window and the state structure, calls the interface builder |
| `rtlca_ui.m` | interface | buildUI, showTab, gotoStep (accordion navigation), onStepClick, syncZone, drawMap (process map) |
| `rtlca_system.m` | Module 1 – system definition and inventory | onLoadDb, onAddProc/onDelProc/onProcsNext, taxonomy callbacks, buildLaw, applyFilter, onAddInput/onRemoveInput, refreshList, onEndFlows, process inspection dialog (openProcDialog, proc*), invalidateConfig, ced_factors |
| `rtlca_costs.m` | LCC data | onEnterCosts (cost window), fillCostTable, costEdit, costSave, onCostsNext |
| `rtlca_sources.m` | Modules 2 and 5 – sources | onLoadRT, onLoadMix, onLoadPrice, cycle clock (populateClock, onDayChanged), map_mix_*, mix_at, onConfirm, promptQS |
| `rtlca_engine.m` | Modules 5-6-7 – cycle engine | createUnified, resetCycle, onStartExp (streaming loop), onNewExp, onStop, onClose, gauge_create/update |
| `rtlca_io.m` | file readers | resolve_file, read_db, read_rt, read_terna, read_prices, to_dn, tonum, is_num, as_text |
| `rtlca_persist.m` | Module 4 – persistence | addLog, onSaveResults, write_sheet |
| `rtlca_util.m` | shared helpers | trunc, energy_toMJ, curData, curTipo, newInputTemplate, costItemNames |

## Where to change what
- Acquisition file format → `read_rt` in `rtlca_io.m` (contract: returns t, data, names, units).
- Live acquisition (DewesoftX) → replace `read_rt`; nothing else changes.
- New cost item → `costItemNames` in `rtlca_util.m`.
- New chart → create in `buildUI` (`rtlca_ui.m`), initialise in `resetCycle`, update in `onStartExp` (`rtlca_engine.m`).
- Grid-mix source mapping → `map_mix_col` in `rtlca_sources.m`.
