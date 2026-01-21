/* =========================
   Training stats renderer
   - Update only TRAINING_DATA to add new weeks
   ========================= */

(function () {
  // -------- Helpers --------
  const toNumber = (x) => {
    if (x === null || x === undefined) return null;
    if (typeof x === "number") return x;

    // Accept "7,9" and "14,7*2"
    const s = String(x).trim().toLowerCase().replace("kg", "").trim();
    if (!s) return null;

    const parts = s.split("*").map(p => p.trim().replace(",", "."));
    const nums = parts.map(p => {
      const n = parseFloat(p);
      return Number.isFinite(n) ? n : null;
    });

    if (nums.some(n => n === null)) return null;
    return nums.reduce((a, b) => a * b, 1);
  };

  const fmt = (n, digits = 0) => {
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("da-DK", { maximumFractionDigits: digits });
  };

  const epley1RM = (w, r) => {
    if (!Number.isFinite(w) || !Number.isFinite(r) || r <= 0) return null;
    return w * (1 + r / 30);
  };

  const normalizeSplit = (s) => String(s || "").toUpperCase().includes("PUSH") ? "PUSH"
    : String(s || "").toUpperCase().includes("PULL") ? "PULL"
    : String(s || "").toUpperCase().includes("LEG") ? "LEGS"
    : "OTHER";

  const bestSetForExercise = (ex) => {
    let best = null; // {weight, reps, tonnage, est1rm}
    (ex.sets || []).forEach(set => {
      const w = toNumber(set.weight);
      const r = toNumber(set.reps);
      if (!Number.isFinite(r)) return;

      // weight can be 0 (bodyweight), tonnage then is 0
      const mult = Number.isFinite(ex.multiplier) ? ex.multiplier : 1;
      const tonnage = (Number.isFinite(w) ? w : 0) * r * mult;
      const est = epley1RM(Number.isFinite(w) ? w : 0, r);

      const cand = { weight: w, reps: r, tonnage, est1rm: est, mult };
      // choose by est1rm then tonnage
      if (!best) best = cand;
      else if ((cand.est1rm || 0) > (best.est1rm || 0)) best = cand;
      else if ((cand.tonnage || 0) > (best.tonnage || 0)) best = cand;
    });
    return best;
  };

  const sessionStats = (session) => {
    let sets = 0, reps = 0, tonnage = 0;
    (session.exercises || []).forEach(ex => {
      const mult = Number.isFinite(ex.multiplier) ? ex.multiplier : 1;
      (ex.sets || []).forEach(set => {
        const r = toNumber(set.reps);
        if (!Number.isFinite(r)) return;
        const w = toNumber(set.weight);
        sets += 1;
        reps += r;

        if (Number.isFinite(w)) {
          tonnage += w * r * mult;
        }
      });
    });
    return { sets, reps, tonnage };
  };

  // -------- Data (update this) --------
  // multiplier:
  // - Use 2 for unilateral exercises (both sides) if you want volume to reflect both.
  // - Use weight like "14,7*2" for DB total load.
  const TRAINING_DATA = [
    {
      date: "2025-12-04",
      split: "PUSH",
      title: "PUSH 1",
      notes: "",
      exercises: [
        { name: "Incline Press", sets: [
          { weight: 60, reps: 10 }, { weight: 60, reps: 8 }, { weight: 60, reps: 7 }, { weight: 60, reps: 6 }
        ]},
        { name: "Flat Chest Press", sets: [
          { weight: 80, reps: 7 }, { weight: 80, reps: 6 }, { weight: 70, reps: 7 }
        ]},
        { name: "Pec Fly", sets: [
          { weight: 86, reps: 8 }, { weight: 86, reps: 7 }, { weight: 86, reps: 7 }
        ]},
        { name: "Shoulder Press", sets: [
          { weight: 45, reps: 6 }, { weight: 41, reps: 7 }, { weight: 41, reps: 6 }
        ]},
        { name: "Leaning Cable Lateral Raise", sets: [
          { weight: "7,9", reps: 8 }, { weight: "7,9", reps: 8 }, { weight: "7,9", reps: 7 }
        ]},
        { name: "Overhead Cable L-U Raise", sets: [
          { weight: "7,4", reps: 9 }, { weight: "7,4", reps: 8 }
        ]},
        { name: "High-incline DB shrugs/row", sets: [
          { weight: 20, reps: 12 }, { weight: 24, reps: 12 }
        ]},
        { name: "Neck Curls & Extensions (superset)", sets: [
          { weight: 5, reps: 10 }, { weight: 5, reps: 8 }, { weight: 5, reps: 7 }
        ]},
        { name: "Overhead Triceps Extension", sets: [
          { weight: "23,8", reps: 9 }, { weight: "23,8", reps: 8 }, { weight: "23,8", reps: 7 }
        ]},
        { name: "Triceps Pushdowns", sets: [
          { weight: "23,8", reps: 9 }, { weight: "23,8", reps: 9 }, { weight: "23,8", reps: 8 }
        ]}
      ]
    },

    {
      date: "2025-12-05",
      split: "PULL",
      title: "PULL 1",
      notes: "",
      exercises: [
        { name: "Deadlift", sets: [
          { weight: 100, reps: 5 }, { weight: 100, reps: 6 }, { weight: 90, reps: 8 }
        ]},
        { name: "Lat Pulldown", sets: [
          { weight: 66, reps: 7 }, { weight: 66, reps: 6 }, { weight: 59, reps: 7 }
        ]},
        { name: "Low Row (DB)", sets: [
          { weight: "17*2", reps: 8 }, { weight: "17*2", reps: 8 }, { weight: "17*2", reps: 8 }
        ]},
        { name: "Chest-supported Row", sets: [
          { weight: 36, reps: 10 }, { weight: 36, reps: 10 }, { weight: 36, reps: 9 }
        ]},
        { name: "Sideways Reverse Flys", sets: [
          { weight: 52, reps: 10 }, { weight: 52, reps: 9 }, { weight: 52, reps: 8 }
        ]},
        { name: "Kneeling Face Pulls", sets: [
          { weight: "23,8", reps: 12 }, { weight: "26,1", reps: 11 }
        ]},
        { name: "Preacher Curls", sets: [
          { weight: 20, reps: 7 }, { weight: 20, reps: 6 }, { weight: 20, reps: 6 }
        ]},
        { name: "Cable Curls", sets: [
          { weight: "23,8", reps: 10 }, { weight: "26,1", reps: 7 }
        ]},
        { name: "Preacher Hammer Curls", sets: [
          { weight: 24, reps: 7 }, { weight: 24, reps: 6 }
        ]},
        { name: "Reverse Wrist Curls", sets: [
          { weight: 6, reps: 6 }, { weight: 5, reps: 8 }
        ]},
        { name: "Wrist Curls", sets: [
          { weight: 6, reps: 11 }, { weight: "7,5", reps: 10 }
        ]}
      ]
    },

    {
      date: "2025-12-06",
      split: "LEGS",
      title: "LEGS 1",
      notes: "10 min pause pga svimmelhed/kvalme (CNS?)",
      exercises: [
        { name: "Squat", sets: [
          { weight: 100, reps: 8 }, { weight: 100, reps: 8 }, { weight: 100, reps: 7 }, { weight: 100, reps: 6 }
        ]},
        { name: "Leg Press", sets: [
          { weight: 141, reps: 9 }, { weight: 141, reps: 9 }, { weight: 141, reps: 8 }, { weight: 141, reps: 7 }
        ]},
        { name: "Prone Leg Curls", sets: [
          { weight: 54, reps: 7 }, { weight: 54, reps: 6 }, { weight: 50, reps: 7 }
        ]},
        { name: "Leg Extension", sets: [
          { weight: 79, reps: 9 }, { weight: 79, reps: 8 }, { weight: 73, reps: 10 }
        ]},
        { name: "Walking Lunges", sets: [
          { weight: 35, reps: 12 }, { weight: 35, reps: 12 }
        ]},
        { name: "Hip Abduction", sets: [
          { weight: 66, reps: 8 }, { weight: 66, reps: 7 }
        ]},
        { name: "Hip Adduction", sets: [
          { weight: 73, reps: 8 }, { weight: 73, reps: 8 }
        ]},
        { name: "Calf Press", sets: [
          { weight: 134, reps: 12 }, { weight: 134, reps: 12 }, { weight: 134, reps: 12 }
        ]},
        { name: "Kneeling Cable Crunch", sets: [
          { weight: "33,8", reps: 12 }, { weight: "33,8", reps: 11 }, { weight: "33,8", reps: 8 }
        ]},
        { name: "Hanging Leg Raises", sets: [
          { weight: 0, reps: 7 }, { weight: 0, reps: 7 }, { weight: 0, reps: 6 }
        ]},
        { name: "Ab Wheel", sets: [
          { weight: 0, reps: 11 }, { weight: 0, reps: 10 }
        ]}
      ]
    },

    {
      date: "2025-12-08",
      split: "PUSH",
      title: "PUSH 2",
      notes: "",
      exercises: [
        { name: "Flat DB Press", sets: [
          { weight: 80, reps: 9 }, { weight: 80, reps: 8 }, { weight: 80, reps: 7 }, { weight: 80, reps: 6 }
        ]},
        { name: "Incline Press", sets: [
          { weight: 70, reps: 7 }, { weight: 70, reps: 5 }, { weight: 60, reps: 7 }
        ]},
        { name: "High-to-Low Fly (DB)", sets: [
          { weight: "14,7*2", reps: 9 }, { weight: "14,7*2", reps: 8 }, { weight: "14,7*2", reps: 7 }
        ]},
        { name: "Machine Shoulder Press", sets: [
          { weight: 45, reps: 6 }, { weight: 41, reps: 7 }, { weight: 41, reps: 6 }
        ]},
        { name: "Leaning Lateral Raise", sets: [
          { weight: "10,2", reps: 7 }, { weight: "7,9", reps: 9 }, { weight: "7,9", reps: 8 }
        ]},
        { name: "Cable Y-Raise", sets: [
          { weight: "7,4*2", reps: 6 }, { weight: "7,4*2", reps: 7 }
        ]},
        { name: "Overhead Cable L-U Raise", sets: [
          { weight: "10,2", reps: 6 }, { weight: "7,4", reps: 9 }
        ]},
        { name: "Neck Extensions", sets: [
          { weight: "7,5", reps: 7 }, { weight: "7,5", reps: 6 }, { weight: 5, reps: 11 }
        ]},
        { name: "Rope Overhead Extension", sets: [
          { weight: "26,1", reps: 7 }, { weight: "26,1", reps: 7 }, { weight: "26,1", reps: 6 }
        ]},
        { name: "Single-arm Pushdown", multiplier: 2, sets: [
          { weight: "10,2", reps: 7 }, { weight: "10,2", reps: 7 }
        ]}
      ]
    },

    {
      date: "2025-12-09",
      split: "PULL",
      title: "PULL 2",
      notes: "",
      exercises: [
        { name: "Rack Pull", sets: [
          { weight: 90, reps: 6 }, { weight: 80, reps: 9 }, { weight: 80, reps: 6 }
        ]},
        { name: "Wide Pulldown", sets: [
          { weight: 59, reps: 8 }, { weight: 59, reps: 6 }, { weight: 52, reps: 8 }
        ]},
        { name: "Single-Arm Kneeling Cable Lat Row", multiplier: 2, sets: [
          { weight: "7,9", reps: 15 }, { weight: "10,2", reps: 15 }, { weight: "12,5", reps: 15 }
        ]},
        { name: "Seated Cable Row", sets: [
          { weight: 59, reps: 9 }, { weight: 59, reps: 9 }, { weight: 59, reps: 8 }
        ]},
        { name: "1-arm DB Row", multiplier: 2, sets: [
          { weight: 24, reps: 8 }, { weight: 24, reps: 8 }, { weight: 24, reps: 7 }
        ]},
        { name: "Sideways reverse flys", sets: [
          { weight: 52, reps: 11 }, { weight: 52, reps: 9 }, { weight: 52, reps: 9 }
        ]},
        { name: "Kneeling Face Pulls", sets: [
          { weight: "26,1", reps: 12 }, { weight: "26,1", reps: 11 }
        ]},
        { name: "Preacher Curl", sets: [
          { weight: 20, reps: 8 }, { weight: 20, reps: 8 }, { weight: 20, reps: null }
        ]},
        { name: "Incline DB Curl", sets: [
          { weight: 24, reps: 9 }, { weight: 24, reps: 9 }
        ]},
        { name: "Preacher Hammer Curl", sets: [
          { weight: 24, reps: 7 }, { weight: 24, reps: 6 }
        ]},
        { name: "Wrist Curls", sets: [
          { weight: 6, reps: 10 }, { weight: 6, reps: 11 }
        ]}
      ]
    },

    {
      date: "2025-12-10",
      split: "LEGS",
      title: "LEGS 2",
      notes: "",
      exercises: [
        { name: "Leg Press", sets: [
          { weight: 147, reps: 10 }, { weight: 147, reps: 9 }, { weight: 147, reps: 9 }, { weight: 147, reps: 8 }
        ]},
        { name: "Hack Squat", sets: [
          { weight: 60, reps: 9 }, { weight: 60, reps: 8 }, { weight: 60, reps: 7 }
        ]},
        { name: "Bulgarian Split Squat", multiplier: 2, sets: [
          { weight: 10, reps: 12 }, { weight: 10, reps: 12 }, { weight: 10, reps: 12 }
        ]},
        { name: "Leg Curls", sets: [
          { weight: 54, reps: 8 }, { weight: 54, reps: 7 }, { weight: 54, reps: 6 }
        ]},
        { name: "Hip Thrust", sets: [
          { weight: 52, reps: 9 }, { weight: 52, reps: 9 }, { weight: 52, reps: 8 }
        ]},
        { name: "Kneeling Cable Crunch", sets: [
          { weight: "33,8", reps: 10 }
        ]},
        { name: "Reverse cable crunch", sets: [
          { weight: 9, reps: 12 }, { weight: "11,3", reps: 9 }, { weight: "11,3", reps: 9 }
        ]},
        { name: "Cable Woodchoppers", sets: [
          { weight: 18, reps: 9 }, { weight: 18, reps: 9 }, { weight: 18, reps: 9 }
        ]}
      ]
    }
  ];

  // -------- Render --------
  const state = { split: "ALL", q: "" };

  const getFiltered = () => {
    const split = state.split;
    const q = state.q.trim().toLowerCase();
    return TRAINING_DATA
      .filter(s => split === "ALL" ? true : normalizeSplit(s.split) === split)
      .map(s => ({
        ...s,
        exercises: (s.exercises || []).filter(ex => q ? ex.name.toLowerCase().includes(q) : true)
      }))
      // keep sessions even if search hides exercises (we still show session header)
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const aggregateExercises = (sessions) => {
    const map = new Map();

    sessions.forEach(sess => {
      (sess.exercises || []).forEach(ex => {
        const key = ex.name.trim();
        if (!map.has(key)) {
          map.set(key, { name: key, sessions: new Set(), sets: 0, reps: 0, tonnage: 0, best: null });
        }
        const row = map.get(key);
        row.sessions.add(sess.date);

        const mult = Number.isFinite(ex.multiplier) ? ex.multiplier : 1;

        (ex.sets || []).forEach(set => {
          const r = toNumber(set.reps);
          if (!Number.isFinite(r)) return;
          const w = toNumber(set.weight);
          row.sets += 1;
          row.reps += r;
          if (Number.isFinite(w)) row.tonnage += w * r * mult;
        });

        const b = bestSetForExercise(ex);
        if (b) {
          if (!row.best) row.best = b;
          else if ((b.est1rm || 0) > (row.best.est1rm || 0)) row.best = b;
          else if ((b.tonnage || 0) > (row.best.tonnage || 0)) row.best = b;
        }
      });
    });

    return Array.from(map.values()).map(r => ({
      ...r,
      sessionsCount: r.sessions.size
    })).sort((a,b) => (b.tonnage - a.tonnage));
  };

  const renderWeekSummary = (sessions) => {
    const el = document.getElementById("weekSummary");
    if (!el) return;

    const totals = sessions.reduce((acc, s) => {
      const st = sessionStats(s);
      acc.sets += st.sets;
      acc.reps += st.reps;
      acc.tonnage += st.tonnage;
      acc.sessions += 1;
      return acc;
    }, { sets: 0, reps: 0, tonnage: 0, sessions: 0 });

    const first = sessions[0]?.date || "—";
    const last  = sessions[sessions.length-1]?.date || "—";

    el.innerHTML = `
      <div class="kv">
        <div class="box"><div class="k">Periode</div><div class="v">${first} → ${last}</div></div>
        <div class="box"><div class="k">Sessions</div><div class="v">${fmt(totals.sessions)}</div></div>
        <div class="box"><div class="k">Tonnage (kg)</div><div class="v">${fmt(totals.tonnage, 0)}</div></div>

        <div class="box"><div class="k">Sæt</div><div class="v">${fmt(totals.sets)}</div></div>
        <div class="box"><div class="k">Reps</div><div class="v">${fmt(totals.reps)}</div></div>
        <div class="box"><div class="k">Avg tonnage/session</div><div class="v">${fmt(totals.sessions ? totals.tonnage/totals.sessions : 0, 0)}</div></div>
      </div>
    `;
  };

  const renderPRList = (exerciseRows) => {
    const el = document.getElementById("prList");
    if (!el) return;

    const top = exerciseRows
      .filter(r => r.best && Number.isFinite(r.best.est1rm))
      .sort((a,b) => (b.best.est1rm - a.best.est1rm))
      .slice(0, 6);

    if (!top.length) {
      el.textContent = "Ingen PR-data endnu (mangler vægt/reps).";
      return;
    }

    el.innerHTML = top.map(r => {
      const b = r.best;
      const setTxt = `${fmt(b.weight, 1)} kg × ${fmt(b.reps)} reps`;
      return `<div class="muted" style="margin-bottom:8px;">
        <strong>${r.name}</strong><br/>
        <span class="small">Bedste sæt: ${setTxt} · Est. 1RM: <strong>${fmt(b.est1rm, 1)}</strong></span>
      </div>`;
    }).join("");
  };

  const renderPlateau = (sessions) => {
    const el = document.getElementById("plateauList");
    if (!el) return;

    // For each exercise, compare best set between earliest and latest appearance
    const seen = new Map(); // name -> [{date, est1rm}]
    sessions.forEach(s => {
      (s.exercises||[]).forEach(ex => {
        const b = bestSetForExercise(ex);
        if (!b || !Number.isFinite(b.est1rm)) return;
        const name = ex.name.trim();
        if (!seen.has(name)) seen.set(name, []);
        seen.get(name).push({ date: s.date, est1rm: b.est1rm, weight: b.weight, reps: b.reps });
      });
    });

    const rows = Array.from(seen.entries())
      .map(([name, arr]) => {
        arr.sort((a,b)=>a.date.localeCompare(b.date));
        if (arr.length < 2) return null;
        const first = arr[0], last = arr[arr.length-1];
        const delta = last.est1rm - first.est1rm;
        return { name, first, last, delta };
      })
      .filter(Boolean)
      .sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta))
      .slice(0, 8);

    if (!rows.length) {
      el.textContent = "Ingen gentagne øvelser i filteret (eller mangler reps).";
      return;
    }

    el.innerHTML = rows.map(r => {
      const sign = r.delta >= 0 ? "+" : "−";
      return `<div class="muted" style="margin-bottom:10px;">
        <strong>${r.name}</strong><br/>
        <span class="small">
          ${r.first.date}: ${fmt(r.first.est1rm,1)} → ${r.last.date}: ${fmt(r.last.est1rm,1)}
          (<strong>${sign}${fmt(Math.abs(r.delta),1)}</strong>)
        </span>
      </div>`;
    }).join("");
  };

  const renderSessions = (sessions) => {
    const el = document.getElementById("sessionCards");
    if (!el) return;

    if (!sessions.length) {
      el.textContent = "Ingen data i filteret endnu.";
      return;
    }

    el.innerHTML = sessions.map(s => {
      const st = sessionStats(s);
      const exCount = (s.exercises || []).length;

      const exLines = (s.exercises || []).map(ex => {
        const b = bestSetForExercise(ex);
        const bTxt = b && Number.isFinite(b.weight)
          ? `${fmt(b.weight,1)}×${fmt(b.reps)} (1RM ${fmt(b.est1rm,1)})`
          : (b ? `${fmt(b.reps)} reps` : "—");

        // list sets compact
        const setList = (ex.sets || [])
          .filter(set => Number.isFinite(toNumber(set.reps)))
          .map(set => `${String(set.weight).replace(".", ",")}×${set.reps}`)
          .join(" · ");

        return `<tr>
          <td><strong>${ex.name}</strong>${ex.multiplier ? ` <span class="muted small">(x${ex.multiplier})</span>` : ""}</td>
          <td class="muted">${setList || "—"}</td>
          <td class="muted">${bTxt}</td>
        </tr>`;
      }).join("");

      return `
        <details>
          <summary>${s.title} · ${s.date} <span class="muted small">(${normalizeSplit(s.split)})</span></summary>

          <div class="kv">
            <div class="box"><div class="k">Øvelser</div><div class="v">${fmt(exCount)}</div></div>
            <div class="box"><div class="k">Sæt</div><div class="v">${fmt(st.sets)}</div></div>
            <div class="box"><div class="k">Tonnage (kg)</div><div class="v">${fmt(st.tonnage,0)}</div></div>
          </div>

          ${s.notes ? `<p class="muted small" style="margin-top:10px;"><i class="fa-regular fa-note-sticky"></i> ${s.notes}</p>` : ""}

          <div class="table-wrap" style="margin-top:10px;">
            <table class="table" style="min-width:760px;">
              <thead>
                <tr>
                  <th>Øvelse</th>
                  <th>Sæt (vægt×reps)</th>
                  <th>Bedste sæt</th>
                </tr>
              </thead>
              <tbody>${exLines || `<tr><td colspan="3" class="muted">Ingen øvelser i filteret</td></tr>`}</tbody>
            </table>
          </div>
        </details>
      `;
    }).join("");
  };

  const renderExerciseTable = (exerciseRows) => {
    const body = document.getElementById("exerciseTableBody");
    if (!body) return;

    if (!exerciseRows.length) {
      body.innerHTML = `<tr><td colspan="7" class="muted">Ingen øvelser i filteret.</td></tr>`;
      return;
    }

    body.innerHTML = exerciseRows.map(r => {
      const b = r.best;
      const bestTxt = b
        ? `${Number.isFinite(b.weight) ? fmt(b.weight,1) + " kg" : "BW"} × ${fmt(b.reps)}`
        : "—";

      const estTxt = b && Number.isFinite(b.est1rm) ? fmt(b.est1rm, 1) : "—";

      return `<tr>
        <td><strong>${r.name}</strong></td>
        <td>${fmt(r.sessionsCount)}</td>
        <td>${fmt(r.sets)}</td>
        <td>${fmt(r.reps)}</td>
        <td>${fmt(r.tonnage,0)}</td>
        <td>${bestTxt}</td>
        <td>${estTxt}</td>
      </tr>`;
    }).join("");
  };

  const renderAll = () => {
    const sessions = getFiltered();
    const exercises = aggregateExercises(sessions);

    renderWeekSummary(sessions);
    renderPRList(exercises);
    renderPlateau(sessions);
    renderSessions(sessions);
    renderExerciseTable(exercises);
  };

  // -------- Wire up UI --------
  document.addEventListener("DOMContentLoaded", () => {
    const splitFilter = document.getElementById("splitFilter");
    const search = document.getElementById("searchExercise");

    if (splitFilter) {
      splitFilter.addEventListener("change", (e) => {
        state.split = e.target.value;
        renderAll();
      });
    }
    if (search) {
      search.addEventListener("input", (e) => {
        state.q = e.target.value;
        renderAll();
      });
    }

    renderAll();
  });

})();
