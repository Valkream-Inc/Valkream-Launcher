const games = () => [
  {
    id: "Valheim-Valkream-v2",
    tipContent: <mabalisereact />,
    descriptionContent: <mabalisereact />,
    links: {
      discord: "url",
      topserver: "url",
      site: "url",
    },
    customGamesSettings: [
      {
        type: "toogle/select",
        settingsName: "modsAdmin",
        option: ["true", "false", "option 3"],
      },
    ],
    debugContent: [
      {
        type: "nexus",
        path: "/mods/nexus",
      },
      {
        type: "thunderstore",
        path: "/mods/thunderstore",
      },
      {
        type: "hash",
        path: "/mods/custom",
      },
    ],
  },
];
