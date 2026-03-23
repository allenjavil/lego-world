import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer

} from "recharts";
import "./App.css";

// optimization animation 
function useRevealOnce() {
  const ref = useRef(null);
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (hasRevealed) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasRevealed(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasRevealed]);

  return [ref, hasRevealed];
}

function App() {
  // optimazation animation-wise
  const themeDataCache = useRef({});
  const [colorGrowthRef, colorGrowthVisible] = useRevealOnce();
  const [heatmapRef, heatmapVisible] = useRevealOnce();
  const [podiumRef, podiumVisible] = useRevealOnce();
  const [avgChartRef, avgChartVisible] = useRevealOnce();
  const [licensingRef, licensingVisible] = useRevealOnce();
  const [modernRef, modernVisible] = useRevealOnce();
  const [complexityRef, complexityVisible] = useRevealOnce();


  // data work
  const [data, setData] = useState([]);
  const [setsData, setSetsData] = useState([]);
  const [themeData, setThemeData] = useState([]);
  const [themeMode, setThemeMode] = useState("set_count");
  const [themeGrouping, setThemeGrouping] = useState("grouped");
  const [themeLoading, setThemeLoading] = useState(false);
  const [modernData, setModernData] = useState([]);
  const [complexityData, setComplexityData] = useState([]);

  //all color consts 
  const [colorsPerYear, setColorsPerYear] = useState([]);
  const [themeColorFamilyData, setThemeColorFamilyData] = useState([]);
  const [colorRankings, setColorRankings] = useState([]);

  const [activeYearBlock, setActiveYearBlock] = useState(null);
  const [activeHeatmapCell, setActiveHeatmapCell] = useState(null);
  const [activePodiumColor, setActivePodiumColor] = useState(null);


  useEffect(() => {
    fetch("/yearly_metrics.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error loading yearly_metrics.json:", err));
  }, []);

  // timeout for better performance for sets_over_time.json
  useEffect(() => {
  const timer = setTimeout(() => {
    fetch("/sets_over_time.json")
      .then((res) => res.json())
      .then((json) => setSetsData(json))
      .catch((err) => console.error("Error loading sets_over_time.json:", err));
  }, 300);

  return () => clearTimeout(timer);
}, []);

  // timeout for better performance for modern_lego_metrics.json
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/modern_lego_metrics.json")
        .then((res) => res.json())
        .then((json) => setModernData(json))
        .catch((err) => console.error("Error loading modern_lego_metrics.json:", err));
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // for theme specifically 
 useEffect(() => {
  const selectedConfig = themeModeConfig[themeMode];
  const path =
    themeGrouping === "grouped"
      ? selectedConfig.groupedPath
      : selectedConfig.topPath;

  if (themeDataCache.current[path]) {
    setThemeData(themeDataCache.current[path]);
    return;
  }

  setThemeLoading(true);

  fetch(path)
    .then((res) => res.json())
    .then((json) => {
      themeDataCache.current[path] = json;
      setThemeData(json);
    })
    .catch((err) => {
      console.error(`Error loading ${path}:`, err);
      setThemeData([]);
    })
    .finally(() => {
      setThemeLoading(false);
    });
}, [themeMode, themeGrouping]);

useEffect(() => {
  const timer = setTimeout(() => {
    fetch("/complexity_metrics_clean.json")
      .then((res) => res.json())
      .then((json) => setComplexityData(json))
      .catch((err) => console.error("Error loading complexity_metrics_clean.json:", err));
  }, 500);

  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  const themePaths = [
    "/theme_yearly_metrics_grouped.json",
    "/theme_yearly_metrics_top.json",
    "/theme_yearly_avg_parts_grouped.json",
    "/theme_yearly_avg_parts_top.json",
    "/theme_yearly_total_parts_grouped.json",
    "/theme_yearly_total_parts_top.json"
  ];

  themePaths.forEach((path) => {
    if (!themeDataCache.current[path]) {
      fetch(path)
        .then((res) => res.json())
        .then((json) => {
          themeDataCache.current[path] = json;
        })
        .catch((err) => console.error(`Error preloading ${path}:`, err));
    }
  });
}, []);

//use effect for colors:
useEffect(() => {
  const timer = setTimeout(() => {
    fetch("/colors_per_year.json")
      .then((res) => res.json())
      .then((json) => setColorsPerYear(json))
      .catch((err) => console.error("Error loading colors_per_year.json:", err));
  }, 300);

  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  const timer = setTimeout(() => {
    fetch("/theme_color_family_summary.json")
      .then((res) => res.json())
      .then((json) => setThemeColorFamilyData(json))
      .catch((err) => console.error("Error loading theme_color_family_summary.json:", err));
  }, 300);

  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  const timer = setTimeout(() => {
    fetch("/color_rankings.json")
      .then((res) => res.json())
      .then((json) => setColorRankings(json))
      .catch((err) => console.error("Error loading color_rankings.json:", err));
  }, 300);

  return () => clearTimeout(timer);
}, []);

  const summary = useMemo(() => {
    if (!data.length) {
      return {
        totalYears: 0,
        latestAvgParts: 0,
        latestSetCount: 0
      };
    }

    const latest = data[data.length - 1];

    return {
      totalYears: data.length,
      latestAvgParts: Math.round(latest.avg_parts || 0),
      latestSetCount: latest.set_count || 0
    };
  }, [data]);

  // updated find max so that it's not that slow 
  const largestSet = useMemo(() => {
    if (!setsData.length) return null;

    return setsData.reduce((max, current) =>
      Number(current.num_parts) > Number(max.num_parts) ? current : max
    );
  }, [setsData]);

  const themeModeConfig = {
  set_count: {
    label: "Set Count",
    groupedPath: "/theme_yearly_metrics_grouped.json",
    topPath: "/theme_yearly_metrics_top.json"
  },
  avg_parts: {
    label: "Avg Parts",
    groupedPath: "/theme_yearly_avg_parts_grouped.json",
    topPath: "/theme_yearly_avg_parts_top.json"
  },
  total_parts: {
    label: "Total Parts",
    groupedPath: "/theme_yearly_total_parts_grouped.json",
    topPath: "/theme_yearly_total_parts_top.json"
  }
};
  const themeKeys = useMemo(() => {
  if (!themeData.length) return [];

  const allKeys = Object.keys(themeData[0]).filter((key) => key !== "year");

  const totals = allKeys.map((key) => ({
    key,
    total: themeData.reduce((sum, row) => sum + (Number(row[key]) || 0), 0)
  }));

  return totals
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((item) => item.key);
}, [themeData]);

const filteredComplexityData = useMemo(() => {
  return complexityData.filter(
    (d) =>
      Number(d.num_parts) > 20 &&
      Number(d.unique_part_types) > 5 &&
      Number(d.complexity_score) > 0
  );
}, [complexityData]);

//diff most optmized to get most complex
const mostComplexSet = useMemo(() => {
  if (!filteredComplexityData.length) return null;

  return filteredComplexityData.reduce((max, current) =>
    Number(current.complexity_score) > Number(max.complexity_score) ? current : max
  );
}, [filteredComplexityData]);

const biggestButSimple = useMemo(() => {
  if (!filteredComplexityData.length) return null;

  const largeSets = filteredComplexityData.filter((d) => Number(d.num_parts) >= 1000);
  if (!largeSets.length) return null;

  return [...largeSets].sort(
    (a, b) =>
      (Number(a.unique_part_types) / Number(a.num_parts)) -
      (Number(b.unique_part_types) / Number(b.num_parts))
  )[0];
}, [filteredComplexityData]);

const maxDistinctColors = useMemo(() => {
  if (!colorsPerYear.length) return 0;
  return Math.max(...colorsPerYear.map((d) => Number(d.distinct_colors_used) || 0));
}, [colorsPerYear]);

const topThemeHeatmapRows = useMemo(() => {
  if (!themeColorFamilyData.length) return [];

  const totals = {};
  themeColorFamilyData.forEach((d) => {
    const theme = d.theme_name;
    const value = Number(d.parts_using_color_family) || 0;
    totals[theme] = (totals[theme] || 0) + value;
  });

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([theme]) => theme);
}, [themeColorFamilyData]);

const colorFamilyColumns = useMemo(() => {
  if (!themeColorFamilyData.length) return [];

  const preferredOrder = [
    "Red",
    "Blue",
    "Yellow",
    "Green",
    "Orange",
    "Pink / Purple",
    "Brown / Tan",
    "Black / Gray",
    "White / Cream",
    "Transparent",
    "Metallic / Special",
    "Other"
  ];

  const presentFamilies = [...new Set(themeColorFamilyData.map((d) => d.color_family))];

  return preferredOrder.filter((family) => presentFamilies.includes(family));
}, [themeColorFamilyData]);

const heatmapMatrix = useMemo(() => {
  if (!themeColorFamilyData.length || !topThemeHeatmapRows.length) return [];

  const lookup = new Map();

  themeColorFamilyData.forEach((d) => {
    lookup.set(`${d.theme_name}|||${d.color_family}`, {
      share_within_theme: Number(d.share_within_theme) || 0,
      parts_using_color_family: Number(d.parts_using_color_family) || 0
    });
  });

  return topThemeHeatmapRows.map((theme) => {
    const row = { theme_name: theme };

    colorFamilyColumns.forEach((family) => {
      row[family] =
        lookup.get(`${theme}|||${family}`) || {
          share_within_theme: 0,
          parts_using_color_family: 0
        };
    });

    return row;
  });
}, [themeColorFamilyData, topThemeHeatmapRows, colorFamilyColumns]);
// helper for the heatmap 
const handleHeatmapEnter = (nextCell) => {
  setActiveHeatmapCell((prev) => {
    if (
      prev &&
      prev.theme_name === nextCell.theme_name &&
      prev.color_family === nextCell.color_family
    ) {
      return prev;
    }
    return nextCell;
  });
};



const podiumTopThree = useMemo(() => {
  if (!colorRankings.length) return [];

  return [...colorRankings]
    .filter((d) => ["top_1", "top_2", "top_3"].includes(d.status_tag))
    .sort((a, b) => Number(b.total_parts_using) - Number(a.total_parts_using));
}, [colorRankings]);

const overlookedColor = useMemo(() => {
  if (!colorRankings.length) return null;

  const forgotten = colorRankings.find((d) => d.status_tag === "forgotten_classic");
  if (forgotten) return forgotten;

  const retired = colorRankings.find((d) => d.status_tag === "retired_feel");
  if (retired) return retired;

  return [...colorRankings]
    .sort((a, b) => Number(a.total_parts_using) - Number(b.total_parts_using))[0] || null;
}, [colorRankings]);

const formatPercent = (value) => `${(Number(value) * 100).toFixed(1)}%`;

const safeHex = (rgb) => {
  if (!rgb) return "#999999";
  return rgb.startsWith("#") ? rgb : `#${rgb}`;
};

const isLightColor = (rgb) => {
  const hex = safeHex(rgb).replace("#", "");
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72;
};

const getPodiumLabel = (statusTag) => {
  if (statusTag === "top_1") return "1st";
  if (statusTag === "top_2") return "2nd";
  if (statusTag === "top_3") return "3rd";
  return "";
};

// MEMO FOR OPTIMIZINGGG 

const displaySetsData = useMemo(() => {
  if (!setsData.length) return [];

  return setsData.filter((_, index) => index % 3 === 0);
}, [setsData]);

const displayComplexityData = useMemo(() => {
  if (!filteredComplexityData.length) return [];
  return filteredComplexityData.filter((_, index) => index % 2 === 0);
}, [filteredComplexityData]);

  const themeColors = {
  "Licensed Worlds": "#3a86ff",
  "Fantasy & Historic": "#9c6644",
  "Engineering & Vehicles": "#8338ec",
  "Everyday Life": "#ffbe0b",
  "Adventure & Sci-Fi": "#4cc9f0",
  "Display & Design": "#43aa8b",
  "Seasonal & Promotional": "#ff70a6",
  "Creative Basics": "#8d99ae",
  "Other": "#adb5bd",

  "Star Wars": "#3a86ff",
  "City": "#ffbe0b",
  "Technic": "#8338ec",
  "Castle": "#9c6644",
  "Space": "#4cc9f0",
  "Friends": "#ff70a6",
  "Bionicle": "#fb5607",
  "Ninjago": "#e63946",
  "Creator": "#43aa8b",
  "Architecture": "#577590",
  "Icons": "#264653"
  };
  return (
    <div className="page">
      <header className="hero">
        <h1>How LEGO Sets Changed Over Time</h1>
        <p className="hero-text">
          Over the decades, LEGO sets appear to have become larger, more detailed, more colorful,
          and more ambitious. This story follows how sets, themes, complexity, and color evolved
          across decades of building!

        </p>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Years in dataset</div>
            <div className="stat-value">{summary.totalYears}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Latest avg. parts</div>
            <div className="stat-value">{summary.latestAvgParts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Latest set count</div>
            <div className="stat-value">{summary.latestSetCount}</div>
          </div>
        </div>
      </header>

      <main className="content">
        <section className="chart-section">
          <div className="section-text">
            <h2>Average Parts per Set</h2>
            <div className="story-divider"></div>
            <p>
              This chart tracks how the average number of parts in a LEGO set has
              changed over time. The broad pattern suggests a long-term shift
              toward more detailed and more complex builds.
            </p>
          </div>

          <div
            ref={avgChartRef}
            className={`chart-card ${avgChartVisible ? "revealed" : "pre-reveal"}`}
          >
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${Math.round(value)} parts`, "Average Parts"]}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="avg_parts"
                  stroke="#d62828"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 6 }}
                  isAnimationActive={avgChartVisible}
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>



          <div className="insight-box">
            For much of LEGO’s early history, average part counts stayed relatively
            modest. In later decades, they climb much more dramatically, suggesting
            a move toward bigger and more elaborate sets.
          </div>
        </section>

        <section className="chart-section">
          <div className="section-text">
            <h2>How Many Sets LEGO Released</h2>
            <div className="story-divider"></div>
            <p>
              Rising complexity is only one part of the story. This second chart
              shows how many sets were released each year, giving context for how
              LEGO’s overall output expanded over time.
            </p>
          </div>

          <div className="chart-card">
            <ResponsiveContainer width="100%" height={420}>
              <AreaChart
                data={data}
                margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [value, "Sets Released"]}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="set_count"
                  stroke="#3a86ff"
                  fill="#3a86ff"
                  fillOpacity={0.25}
                  strokeWidth={3}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="insight-box">
            LEGO didn’t just make larger sets over time. It also appears to have
            expanded the number of sets released, pointing to growth in both scale
            and variety.
          </div>
        </section>

        <section className="chart-section">
          <div className="section-text">
            <h2>What This Suggests</h2>
            <div className="story-divider"></div>
            <p>
              Looking at both charts together, the product line seems to evolve in
              two directions at once: more sets overall, and more complex builds on
              average. That combination hints at LEGO’s growth from a simpler toy
              catalog into a broader and more sophisticated design ecosystem.
            </p>
            <p className="footer-note">
              Next, the strongest follow-up is to break this story down by theme.
              That will help answer whether the growth in complexity is widespread
              across LEGO or concentrated in certain categories.
            </p>
          </div>
        </section>
        <section className="chart-section">
          <div className="section-text">
            <h2>Growth and Complexity</h2>
            <div className="story-divider"></div>
            <p>
              Average values tell only part of the story. Looking at individual sets
              reveals how LEGO’s range widened over time, with later decades showing
              many more large and highly ambitious builds.
            </p>
          </div>

          <div className="chart-card">
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="year"
                  name="Year"
                  tick={{ fontSize: 12 }}
                  domain={["dataMin", "dataMax"]}
                />
                <YAxis
                  type="number"
                  dataKey="num_parts"
                  name="Parts"
                  tick={{ fontSize: 12 }}
                  scale="log"
                  domain={[1,"auto"]}
                />
                <ZAxis range={[60]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => {
                    if (name === "num_parts") return [`${value} parts`, "Parts"];
                    return [value, name];
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="custom-tooltip">
                          <strong>{d.set_name}</strong>
                          <div>Year: {d.year}</div>
                          <div>Theme: {d.theme_name}</div>
                          <div>Parts: {Number(d.num_parts).toLocaleString()}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={displaySetsData}
                  fill="#d62828"
                  fillOpacity={0.35}
                  isAnimationActive={false}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="insight-box">
            Average values tell only part of the story. Looking at individual sets
            reveals how LEGO’s range widened over time, with later decades showing
            many more large and highly ambitious builds. A logarithmic y-axis helps
            reveal both the dense cluster of smaller sets and the extreme outliers.
          </div>
          {largestSet && (
            <div className="outlier-box">
              <strong>Outlier watch:</strong> {largestSet.set_name} ({largestSet.year}) from{" "}
              {largestSet.theme_name} has {largestSet.num_parts.toLocaleString()} parts.
              This is the kind of set that turns building into an all-day event.
            </div>
          )}
        </section>

        <section className="chart-section licensing-section">
          <div className="section-text">
            <h2>The Licensing Era</h2>
            <div className="story-divider"></div>
            <p>
              As LEGO expanded, its product line became increasingly shaped by major
              themes and licensed worlds. This view shows how dominant themes rose
              and fell over time — and how branded or specialized lines helped define
              new eras of LEGO.
            </p>

            <p>
              This view can switch between official theme families and broader storytelling
              groups. Grouped mode helps reduce the long tail of niche themes and makes the
              major shifts in LEGO’s product strategy easier to see.
            </p>
          </div>

          <div className="mode-toggle">
            {Object.entries(themeModeConfig).map(([key, config]) => (
              <button
                key={key}
                className={`mode-button ${themeMode === key ? "active" : ""}`}
                onClick={() => setThemeMode(key)}
              >
                {config.label}
              </button>
            ))}
          </div>
          <div className="mode-toggle">
            <button
              className={`mode-button ${themeGrouping === "grouped" ? "active" : ""}`}
              onClick={() => setThemeGrouping("grouped")}
            >
              Story Groups
            </button>
            <button
              className={`mode-button ${themeGrouping === "top" ? "active" : ""}`}
              onClick={() => setThemeGrouping("top")}
            >
              Official Themes
            </button>
            <p className="mode-helper-text">
              Viewing {themeGrouping === "grouped" ? "story groups" : "official themes"} by{" "}
              {themeModeConfig[themeMode].label.toLowerCase()}.
            </p>
          </div>

          <div
            ref={licensingRef}
            className={`chart-card licensing-card ${licensingVisible ? "revealed" : "pre-reveal"}`}
          >
            {themeLoading ? (
              <div className="chart-loading">Loading theme view...</div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <AreaChart
                  data={themeData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;

                      const sortedPayload = [...payload]
                        .filter((item) => item.value > 0)
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 6);

                      return (
                        <div className="custom-tooltip">
                          <strong>Year: {label}</strong>
                          {sortedPayload.map((item) => (
                            <div key={item.dataKey}>
                              {item.dataKey}: {Number(item.value).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />

                  {themeKeys.map((theme) => (
                    <Area
                      key={theme}
                      type="monotone"
                      dataKey={theme}
                      stackId="1"
                      stroke={themeColors[theme] || "#999"}
                      fill={themeColors[theme] || "#999"}
                      fillOpacity={0.85}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
            <div className="insight-box">
              Theme structure helps explain LEGO’s growth. Instead of a single broad
              catalog, the company increasingly organized its output into distinct
              worlds, some of which became major drivers of visibility and scale.
            </div>
        </section>

        <section className="chart-section modern-section">
          <div className="section-text">
            <h2>Modern LEGO: Bigger, Bolder, More Display-Oriented</h2>
            <div className="story-divider"></div>
            <p>
              In the 2010s and beyond, LEGO increasingly embraced large flagship sets,
              display pieces, and builds aimed at older audiences. One way to see that
              shift is to track how often very large sets appear in the catalog.
            </p>
          </div>

          <div
            ref={modernRef}
            className={`chart-card modern-card ${modernVisible ? "revealed" : "pre-reveal"}`}
          >
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={modernData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "large_set_count") return [value, "Sets with 1000+ parts"];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="large_set_count"
                  stroke="#ffbe0b"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="insight-box">
            The modern era shows a much stronger presence of very large sets. This
            suggests LEGO is not only growing in complexity, but also increasingly
            designing for collectors, display builders, and longer build experiences.
          </div>
        </section>

        <section className="chart-section complexity-section">
          <div className="section-text">
            <h2>Complexity Deep Dive</h2>
            <div className="story-divider"></div>
            <p>
              Bigger does not always mean more complex. Using inventory-level data, this
              view compares a set’s total size with the number of distinct part types it
              uses. That helps separate sheer scale from structural variety.
            </p>

            <p className="metric-note">
              Complexity score combines total parts, number of unique part types, and color variety.
            </p>
          </div>

          <div
              ref={complexityRef}
              className={`chart-card deep-dive-card ${complexityVisible ? "revealed" : "pre-reveal"}`}
           >
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="num_parts"
                  name="Parts"
                  tick={{ fontSize: 12 }}
                  scale="log"
                  domain={[10, "auto"]}

                />
                <YAxis
                  type="number"
                  dataKey="unique_part_types"
                  name="Unique Part Types"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="custom-tooltip">
                          <strong>{d.set_name}</strong>
                          <div>Year: {d.year}</div>
                          <div>Theme: {d.theme_name}</div>
                          <div>Parts: {Number(d.num_parts).toLocaleString()}</div>
                          <div>Unique part types: {Number(d.unique_part_types).toLocaleString()}</div>
                          <div>Unique colors: {Number(d.unique_colors).toLocaleString()}</div>
                          <div>Complexity score: {Number(d.complexity_score).toFixed(1)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={displayComplexityData}
                  fill="#8338ec"
                  fillOpacity={0.35}
                  isAnimationActive={false}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="insight-box">
            Sets in the upper-right combine scale with structural diversity. Sets farther
            right but lower on the chart are large, but rely more heavily on repeated parts.
          </div>

            {mostComplexSet && biggestButSimple && (
              <div className="comparison-box visual-comparison-box">
                <div className="comparison-item visual-card">
                  <div className="visual-card-image placeholder-image">
                    <img src="/images/ultimatebattleofchima.jpg" alt={mostComplexSet.set_name} />
                  </div>
                  <div className="visual-card-body">
                    <div className="visual-card-tag">High complexity</div>
                    <h4>{mostComplexSet.set_name}</h4>
                    <p>{mostComplexSet.theme_name} · {mostComplexSet.year}</p>
                    <div className="visual-stat">{Number(mostComplexSet.num_parts).toLocaleString()} parts</div>
                    <div className="visual-stat">Score: {Number(mostComplexSet.complexity_score).toFixed(1)}</div>
                  </div>
                </div>

                <div className="comparison-item visual-card">
                  <div className="visual-card-image placeholder-image">
                    <img src="/images/worldmap.png" alt={biggestButSimple.set_name} />
                  </div>
                  <div className="visual-card-body">
                    <div className="visual-card-tag">Large but repetitive</div>
                    <h4>{biggestButSimple.set_name}</h4>
                    <p>{biggestButSimple.theme_name} · {biggestButSimple.year}</p>
                    <div className="visual-stat">{Number(biggestButSimple.num_parts).toLocaleString()} parts</div>
                    <div className="visual-stat">Score: {Number(biggestButSimple.complexity_score).toFixed(1)}</div>
                  </div>
                </div>
              </div>
            )}


        </section>

        <section className="chart-section color-section">
          <div className="section-text">
            <h2>Color Expansion</h2>
            <div className="story-divider"></div>
            <p>
              LEGO’s story is not only about more pieces. It is also about more color. Over time,
              the palette grew from a handful of familiar tones into a much brighter and wider world
              of visual possibilities.
            </p>
          </div>

          <div
            ref={colorGrowthRef}
            className={`chart-card color-growth-card ${colorGrowthVisible ? "revealed" : "pre-reveal"}`}
          >
            <div className="color-card-header">
              <div>
                <h3>Distinct Colors Used by Year</h3>
                <p>
                  Blue shows the total number of distinct colors used in a given year.
                  Yellow marks how many of those were newly introduced.
                </p>
              </div>

              <div className="color-legend">
                <div className="legend-item">
                  <span className="legend-swatch legend-blue"></span>
                  <span>Total distinct colors</span>
                </div>
                <div className="legend-item">
                  <span className="legend-swatch legend-yellow"></span>
                  <span>Newly introduced colors</span>
                </div>
              </div>
            </div>

            <div className="color-growth-bars-wrap">
              <div className="color-growth-bars">
                {colorsPerYear.map((d, index) => {
                  const distinct = Number(d.distinct_colors_used) || 0;
                  const newColors = Number(d.new_colors_introduced) || 0;
                  const totalHeight = maxDistinctColors
                    ? Math.max(18, (distinct / maxDistinctColors) * 260)
                    : 18;

                  const newHeight = maxDistinctColors
                    ? Math.min(totalHeight, Math.max(0, (newColors / maxDistinctColors) * 260))
                    : 0;

                  return (
                    <button
                        key={d.year}
                        type="button"
                        className={`color-year-bar ${activeYearBlock?.year === d.year ? "active" : ""}`}
                        style={{ transitionDelay: `${Math.min(index * 16, 500)}ms` }}
                        onMouseEnter={() => setActiveYearBlock(d)}
                        onFocus={() => setActiveYearBlock(d)}
                        onMouseLeave={() => setActiveYearBlock(null)}
                        onBlur={() => setActiveYearBlock(null)}
                        aria-label={`Year ${d.year}, ${distinct} distinct colors, ${newColors} new colors`}

                    >


                      <div className="bar-visual">
                        <div
                          className="bar-total"
                          style={{ height: `${totalHeight}px` }}
                        >
                          <div
                            className="bar-new"
                            style={{ height: `${newHeight}px` }}
                          />
                        </div>
                      </div>
                      <div className="year-label-horizontal">{d.year}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="color-growth-tooltip-panel">
              {activeYearBlock ? (
                <>
                  <div className="tooltip-year">{activeYearBlock.year}</div>
                  <div className="tooltip-stat-grid">
                    <div>
                      <span>Distinct colors</span>
                      <strong>{activeYearBlock.distinct_colors_used}</strong>
                    </div>
                    <div>
                      <span>New colors</span>
                      <strong>{activeYearBlock.new_colors_introduced}</strong>
                    </div>
                    <div>
                      <span>Top color</span>
                      <strong>{activeYearBlock.top_color_name}</strong>
                    </div>
                    <div>
                      <span>Top color share</span>
                      <strong>{formatPercent(activeYearBlock.top_color_share)}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="hover-hint">
                  Hover over a year to compare total color variety and new additions.
                </div>
              )}
            </div>
          </div>


          <div 
            ref={heatmapRef}
            className={`chart-card theme-heatmap-card ${heatmapVisible ? "revealed" : "pre-reveal"}`}
          >
            <div className="color-card-header">
              <div>
                <h3>Theme Color Fingerprints</h3>
                <p>
                  Some themes stayed grounded in practical colors. Others pushed the palette
                  into brighter, softer, or more specialized directions.
                </p>
              </div>
            </div>

            <div className="theme-heatmap-wrap">
              <div className="theme-heatmap-grid">
                <div className="heatmap-corner"></div>
                {colorFamilyColumns.map((family) => (
                  <div key={family} className="heatmap-col-label">
                    {family}
                  </div>
                ))}

                {heatmapMatrix.map((row,rowIndex) => (
                  <div 
                    key={row.theme_name}
                    className="heatmap-row-group"
                    style={{
                      display: "contents",
                      "--row-delay": `${Math.min(rowIndex * 70, 500)}ms`
                    }}
                  >
                    <div className="heatmap-row-label">
                      {row.theme_name}
                    </div>

                    {colorFamilyColumns.map((family) => {
                      const cell = row[family];
                      const opacity = Math.max(0.08, Math.min(cell.share_within_theme * 3.4, 1));

                      return (
                        <div
                          key={`${row.theme_name}-${family}`}
                          className="heatmap-cell"
                          style={{ opacity }}
                          onMouseEnter={() =>
                            handleHeatmapEnter({
                              theme_name: row.theme_name,
                              color_family: family,
                              ...cell
                            })
                          }
                          onMouseLeave={() => setActiveHeatmapCell(null)}
                        >
                          <div className="heatmap-cell-inner">
                            {Math.round(cell.share_within_theme * 100)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}


              </div>

              <div className="heatmap-side-panel">
                {activeHeatmapCell ? (
                  <>
                    <h4>{activeHeatmapCell.theme_name}</h4>
                    <p className="heatmap-focus-family">{activeHeatmapCell.color_family}</p>
                    <div className="tooltip-stat-grid">
                      <div>
                        <span>Share within theme</span>
                        <strong>{formatPercent(activeHeatmapCell.share_within_theme)}</strong>
                      </div>
                      <div>
                        <span>Parts in family</span>
                        <strong>{activeHeatmapCell.parts_using_color_family.toLocaleString()}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h4>Hover a heatmap cell</h4>
                    <p>
                      This view compares how strongly different themes rely on each color family.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          
          <div
            ref={podiumRef}
            className={`chart-card color-podium-card ${podiumVisible ? "revealed" : "pre-reveal"}`}
          >
            <div className="section-text podium-text">
              <h3>The Palette Champions</h3>
              <p>
                Some colors became core to the LEGO system. Others were more niche, more temporary,
                or quietly faded from view.
              </p>
            </div>

        <div className="podium-stage">
          <div className="podium-platform">
            <div className="podium-step podium-step-2"></div>
            <div className="podium-step podium-step-1"></div>
            <div className="podium-step podium-step-3"></div>

            {podiumTopThree.map((color, index) => (
              <div
                key={color.color_id}
                className={`podium-slot podium-slot-${index + 1} ${
                  activePodiumColor?.color_id === color.color_id ? "active" : ""
                }`}
                style={{ transitionDelay: `${180 + index * 120}ms` }}
                onMouseEnter={() => setActivePodiumColor(color)}
                onMouseLeave={() => setActivePodiumColor(null)}
              >
                <div
                  className={`lego-podium-brick ${isLightColor(color.rgb_hex) ? "light-brick" : ""}`}
                  style={{ "--brick-color": safeHex(color.rgb_hex) }}
                >
                  <div className="lego-top-face">
                    <div className="brick-studs">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>

                  <div className="lego-front-face">
                    <div className="brick-rank">{getPodiumLabel(color.status_tag)}</div>
                    <div className="brick-name">{color.color_name}</div>
                  </div>

                  <div className="lego-side-face"></div>
                </div>
              </div>
            ))}
          </div>

          {overlookedColor && (
            <div
              className={`overlooked-slot ${
                activePodiumColor?.color_id === overlookedColor.color_id ? "active" : ""
              }`}
              style={{ transitionDelay: "560ms" }}
              onMouseEnter={() => setActivePodiumColor(overlookedColor)}
              onMouseLeave={() => setActivePodiumColor(null)}
            >
              <div
                className={`lego-overlooked-brick ${isLightColor(overlookedColor.rgb_hex) ? "light-brick" : ""}`}
                style={{ "--brick-color": safeHex(overlookedColor.rgb_hex) }}
              >
                <div className="lego-top-face">
                  <div className="brick-studs brick-studs-small">
                    <span></span>
                    <span></span>
                  </div>
                </div>

                <div className="lego-front-face">
                  <div className="overlooked-label">Overlooked</div>
                  <div className="brick-name">{overlookedColor.color_name}</div>
                </div>

                <div className="lego-side-face"></div>
              </div>
            </div>
          )}
        </div>  
              
            <div className="podium-detail-panel">
              {activePodiumColor ? (
                <>
                  <h4>{activePodiumColor.color_name}</h4>
                  <div
                    className="detail-color-chip"
                    style={{ backgroundColor: safeHex(activePodiumColor.rgb_hex) }}
                  />
                  <div className="tooltip-stat-grid">
                    <div>
                      <span>First year</span>
                      <strong>{activePodiumColor.first_year}</strong>
                    </div>
                    <div>
                      <span>Peak year</span>
                      <strong>{activePodiumColor.peak_year}</strong>
                    </div>
                    <div>
                      <span>Top theme</span>
                      <strong>{activePodiumColor.peak_theme}</strong>
                    </div>
                    <div>
                      <span>Top set</span>
                      <strong>{activePodiumColor.top_set_name}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="hover-hint">
                  Hover over the bricks to explore LEGO’s most-used and most-overlooked colors.
                </div>
              )}
            </div>
          </div>

          <div className="insight-box">
            LEGO’s history is also a history of palette growth. The system expanded not just
            in size, but in visual vocabulary: themes developed their own color identities,
            and a few shades became foundational across decades of building.
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;