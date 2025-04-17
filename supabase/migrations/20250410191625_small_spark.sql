/*
  # Add initial fighter data

  1. Data Added
    - Adds 20 sample UFC fighters with realistic data
    - Includes fighters from different weight classes
    - Contains mix of active champions and contenders

  2. Data Structure
    - Full fighter profiles including:
      - Name, nickname, weight class
      - Physical stats (height, reach)
      - Record (wins, losses, draws)
      - Country and team information
*/

INSERT INTO fighters (
  first_name,
  last_name,
  nickname,
  weight_class,
  country,
  team,
  height_cm,
  reach_cm,
  stance,
  dob,
  wins,
  losses,
  draws,
  no_contests,
  created_at,
  updated_at
) VALUES
  ('Jon', 'Jones', 'Bones', 'Heavyweight', 'United States', 'Jackson Wink MMA', 193, 215, 'Orthodox', '1987-07-19', 27, 1, 0, 1, NOW(), NOW()),
  ('Israel', 'Adesanya', 'The Last Stylebender', 'Middleweight', 'Nigeria', 'City Kickboxing', 193, 203, 'Switch', '1989-07-22', 24, 2, 0, 0, NOW(), NOW()),
  ('Alexander', 'Volkanovski', 'The Great', 'Featherweight', 'Australia', 'City Kickboxing', 168, 182, 'Orthodox', '1988-09-29', 25, 3, 0, 0, NOW(), NOW()),
  ('Charles', 'Oliveira', 'Do Bronx', 'Lightweight', 'Brazil', 'Chute Boxe', 178, 188, 'Orthodox', '1989-10-17', 34, 9, 0, 1, NOW(), NOW()),
  ('Francis', 'Ngannou', 'The Predator', 'Heavyweight', 'Cameroon', 'Xtreme Couture', 193, 211, 'Orthodox', '1986-09-05', 17, 3, 0, 0, NOW(), NOW()),
  ('Kamaru', 'Usman', 'The Nigerian Nightmare', 'Welterweight', 'Nigeria', 'ONX Sports', 183, 193, 'Orthodox', '1987-05-11', 20, 3, 0, 0, NOW(), NOW()),
  ('Amanda', 'Nunes', 'The Lioness', 'Women''s Bantamweight', 'Brazil', 'American Top Team', 173, 175, 'Orthodox', '1988-05-30', 22, 5, 0, 0, NOW(), NOW()),
  ('Dustin', 'Poirier', 'The Diamond', 'Lightweight', 'United States', 'American Top Team', 175, 183, 'Southpaw', '1989-01-19', 29, 7, 0, 1, NOW(), NOW()),
  ('Max', 'Holloway', 'Blessed', 'Featherweight', 'United States', 'Hawaii Elite MMA', 180, 175, 'Orthodox', '1991-12-04', 24, 7, 0, 0, NOW(), NOW()),
  ('Zhang', 'Weili', 'Magnum', 'Women''s Strawweight', 'China', 'Black Tiger Fight Club', 163, 165, 'Orthodox', '1989-08-13', 23, 3, 0, 0, NOW(), NOW()),
  ('Justin', 'Gaethje', 'The Highlight', 'Lightweight', 'United States', 'ONX Sports', 180, 178, 'Orthodox', '1988-11-14', 24, 4, 0, 0, NOW(), NOW()),
  ('Robert', 'Whittaker', 'The Reaper', 'Middleweight', 'Australia', 'Gracie Jiu-Jitsu Smeaton Grange', 183, 185, 'Orthodox', '1990-12-20', 24, 6, 0, 0, NOW(), NOW()),
  ('Leon', 'Edwards', 'Rocky', 'Welterweight', 'United Kingdom', 'Team Renegade', 183, 188, 'Southpaw', '1991-08-25', 21, 3, 0, 1, NOW(), NOW()),
  ('Brandon', 'Moreno', 'The Assassin Baby', 'Flyweight', 'Mexico', 'Entram Gym', 170, 178, 'Orthodox', '1993-12-07', 21, 6, 2, 0, NOW(), NOW()),
  ('Valentina', 'Shevchenko', 'Bullet', 'Women''s Flyweight', 'Kyrgyzstan', 'Tiger Muay Thai', 168, 168, 'Orthodox', '1988-03-07', 23, 4, 0, 0, NOW(), NOW()),
  ('Sean', 'O''Malley', 'Sugar', 'Bantamweight', 'United States', 'MMA Lab', 180, 183, 'Orthodox', '1994-10-24', 16, 1, 0, 1, NOW(), NOW()),
  ('Islam', 'Makhachev', NULL, 'Lightweight', 'Russia', 'American Kickboxing Academy', 178, 178, 'Orthodox', '1991-10-27', 24, 1, 0, 0, NOW(), NOW()),
  ('Khamzat', 'Chimaev', 'Borz', 'Welterweight', 'Sweden', 'Allstars Training Center', 188, 188, 'Orthodox', '1994-05-01', 12, 0, 0, 0, NOW(), NOW()),
  ('Alex', 'Pereira', 'Poatan', 'Middleweight', 'Brazil', 'Teixeira MMA & Fitness', 193, 203, 'Orthodox', '1987-07-07', 7, 2, 0, 0, NOW(), NOW()),
  ('Jamahal', 'Hill', 'Sweet Dreams', 'Light Heavyweight', 'United States', 'Black Lion BJJ', 193, 198, 'Southpaw', '1991-05-19', 12, 1, 0, 1, NOW(), NOW());