-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 05, 2026 at 05:09 PM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 7.4.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `afroagri`
--

-- --------------------------------------------------------

--
-- Table structure for table `champs`
--

CREATE TABLE `champs` (
  `id_champ` int(11) NOT NULL,
  `superficie` float DEFAULT NULL,
  `source_eau` enum('Forage','pluie','Irrigation','Reviere') NOT NULL,
  `longitude` float NOT NULL,
  `latitude` float NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `etude_sol`
--

CREATE TABLE `etude_sol` (
  `id_etude_sol` int(11) NOT NULL,
  `id_champ` int(11) NOT NULL,
  `date` date NOT NULL,
  `py_sol` varchar(50) NOT NULL,
  `matiere_organique` varchar(150) NOT NULL,
  `azote` varchar(50) NOT NULL,
  `phosphore` varchar(150) NOT NULL,
  `potassium` varchar(150) NOT NULL,
  `humidite` varchar(150) NOT NULL,
  `type_sol` varchar(180) NOT NULL,
  `fertilite` varchar(50) NOT NULL,
  `rapport_analyse` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `journal_plante`
--

CREATE TABLE `journal_plante` (
  `id_journal` int(11) NOT NULL,
  `id_plante` int(11) NOT NULL,
  `date_observation` date NOT NULL DEFAULT current_timestamp(),
  `stade_croissance` varchar(150) NOT NULL,
  `symptomes` varchar(150) NOT NULL,
  `ravageur_suspecte` varchar(150) NOT NULL,
  `maladie_suspecte` varchar(150) NOT NULL,
  `id_user` int(11) NOT NULL,
  `session_uuid` varchar(150) NOT NULL,
  `longitude` float NOT NULL,
  `latitude` float NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `plantes`
--

CREATE TABLE `plantes` (
  `id_plante` int(11) NOT NULL,
  `nom_plante` varchar(50) NOT NULL,
  `variete` date NOT NULL,
  `id_champ` int(11) NOT NULL,
  `date_plantation` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `update_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `type_user`
--

CREATE TABLE `type_user` (
  `id_type` int(11) NOT NULL,
  `type` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `type_user`
--

INSERT INTO `type_user` (`id_type`, `type`) VALUES
(1, 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_user` int(11) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `id_type` int(11) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `update_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id_user`, `nom`, `prenom`, `id_type`, `email`, `password`, `created_at`, `update_at`) VALUES
(1, 'admin', 'kithub', 1, 'admin@kit-hub.com', 'password', '2026-06-05 15:05:51', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `champs`
--
ALTER TABLE `champs`
  ADD PRIMARY KEY (`id_champ`);

--
-- Indexes for table `etude_sol`
--
ALTER TABLE `etude_sol`
  ADD PRIMARY KEY (`id_etude_sol`),
  ADD KEY `bec` (`id_champ`);

--
-- Indexes for table `journal_plante`
--
ALTER TABLE `journal_plante`
  ADD PRIMARY KEY (`id_journal`),
  ADD KEY `cjp` (`id_plante`),
  ADD KEY `cuj` (`id_user`);

--
-- Indexes for table `plantes`
--
ALTER TABLE `plantes`
  ADD PRIMARY KEY (`id_plante`),
  ADD KEY `ccp` (`id_champ`);

--
-- Indexes for table `type_user`
--
ALTER TABLE `type_user`
  ADD PRIMARY KEY (`id_type`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD KEY `cutu` (`id_type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `champs`
--
ALTER TABLE `champs`
  MODIFY `id_champ` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `etude_sol`
--
ALTER TABLE `etude_sol`
  MODIFY `id_etude_sol` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `journal_plante`
--
ALTER TABLE `journal_plante`
  MODIFY `id_journal` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `plantes`
--
ALTER TABLE `plantes`
  MODIFY `id_plante` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `type_user`
--
ALTER TABLE `type_user`
  MODIFY `id_type` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `etude_sol`
--
ALTER TABLE `etude_sol`
  ADD CONSTRAINT `bec` FOREIGN KEY (`id_champ`) REFERENCES `champs` (`id_champ`);

--
-- Constraints for table `journal_plante`
--
ALTER TABLE `journal_plante`
  ADD CONSTRAINT `cjp` FOREIGN KEY (`id_plante`) REFERENCES `plantes` (`id_plante`),
  ADD CONSTRAINT `cuj` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`);

--
-- Constraints for table `plantes`
--
ALTER TABLE `plantes`
  ADD CONSTRAINT `ccp` FOREIGN KEY (`id_champ`) REFERENCES `champs` (`id_champ`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `cutu` FOREIGN KEY (`id_type`) REFERENCES `type_user` (`id_type`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
