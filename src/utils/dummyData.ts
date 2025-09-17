export interface BlueProjectPoint {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number]; // [lng, lat]
  state: string;
  credits: number;
  area: number;
  status: 'verified' | 'pending' | 'rejected';
  projectType: 'mangrove' | 'seagrass' | 'saltmarsh' | 'coral';
  organization: string;
}

export const indiaBlueProjectsData: BlueProjectPoint[] = [
  {
    id: '1',
    name: 'Sundarbans Mangrove Restoration',
    location: 'Sundarbans, West Bengal',
    coordinates: [88.4337, 21.9497],
    state: 'West Bengal',
    credits: 15000,
    area: 500,
    status: 'verified',
    projectType: 'mangrove',
    organization: 'Bengal Blue NGO'
  },
  {
    id: '2',
    name: 'Andaman Blue Carbon Initiative',
    location: 'Port Blair, Andaman & Nicobar',
    coordinates: [92.7265, 11.6234],
    state: 'Andaman & Nicobar Islands',
    credits: 8500,
    area: 300,
    status: 'verified',
    projectType: 'coral',
    organization: 'Andaman Conservation Society'
  },
  {
    id: '3',
    name: 'Odisha Coastal Restoration',
    location: 'Chilika Lake, Odisha',
    coordinates: [85.4669, 19.7007],
    state: 'Odisha',
    credits: 12000,
    area: 450,
    status: 'verified',
    projectType: 'mangrove',
    organization: 'Coastal Care Odisha'
  },
  {
    id: '4',
    name: 'Maharashtra Mangrove Project',
    location: 'Ratnagiri, Maharashtra',
    coordinates: [73.3, 16.9944],
    state: 'Maharashtra',
    credits: 9500,
    area: 350,
    status: 'pending',
    projectType: 'mangrove',
    organization: 'Konkan Green Foundation'
  },
  {
    id: '5',
    name: 'Kerala Backwater Conservation',
    location: 'Kochi, Kerala',
    coordinates: [76.2711, 9.9312],
    state: 'Kerala',
    credits: 7200,
    area: 280,
    status: 'verified',
    projectType: 'seagrass',
    organization: 'Kerala Marine Conservation'
  },
  {
    id: '6',
    name: 'Gujarat Salt Marsh Initiative',
    location: 'Kutch, Gujarat',
    coordinates: [69.8597, 23.7337],
    state: 'Gujarat',
    credits: 11000,
    area: 400,
    status: 'verified',
    projectType: 'saltmarsh',
    organization: 'Gujarat Coastal Foundation'
  },
  {
    id: '7',
    name: 'Tamil Nadu Seagrass Restoration',
    location: 'Rameshwaram, Tamil Nadu',
    coordinates: [79.3129, 9.2876],
    state: 'Tamil Nadu',
    credits: 6800,
    area: 250,
    status: 'pending',
    projectType: 'seagrass',
    organization: 'Tamil Marine Trust'
  },
  {
    id: '8',
    name: 'Goa Mangrove Conservation',
    location: 'Mandovi River, Goa',
    coordinates: [73.7712, 15.4909],
    state: 'Goa',
    credits: 4500,
    area: 180,
    status: 'verified',
    projectType: 'mangrove',
    organization: 'Goa Green Initiative'
  },
  {
    id: '9',
    name: 'Andhra Pradesh Coastal Project',
    location: 'Visakhapatnam, Andhra Pradesh',
    coordinates: [83.2185, 17.6868],
    state: 'Andhra Pradesh',
    credits: 10200,
    area: 380,
    status: 'verified',
    projectType: 'mangrove',
    organization: 'Andhra Coastal Care'
  },
  {
    id: '10',
    name: 'Karnataka Coastal Restoration',
    location: 'Mangalore, Karnataka',
    coordinates: [74.8560, 12.9141],
    state: 'Karnataka',
    credits: 5400,
    area: 220,
    status: 'pending',
    projectType: 'mangrove',
    organization: 'Karnataka Blue Foundation'
  }
];

export const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CarbonCreditSimple {
    constructor() {
        verifier = msg.sender;
    }
    address public verifier;

    struct Seller {
        bool hasSubmitted;
        uint256 credits;
        uint256 forSale;
    }

    mapping(address => Seller) public sellers;
    mapping(address => uint256) public buyers; // track purchased credits

    modifier onlyVerifier() {
        require(msg.sender == verifier, "Only verifier");
        _;
    }

    function submitDocument() external {
        sellers[msg.sender].hasSubmitted = true;
    }

    function assignTokens(address _seller, uint256 _amount) external onlyVerifier {
        require(sellers[_seller].hasSubmitted, "Seller not eligible");
        sellers[_seller].credits += _amount;
    }

    function releaseForSale(uint256 _amount) external {
        Seller storage s = sellers[msg.sender];
        require(s.hasSubmitted, "Not a seller");
        require(s.credits >= _amount, "Not enough credits");
        s.forSale = _amount;
    }

    function buy(address _seller, uint256 _amount) external payable {
        Seller storage s = sellers[_seller];
        require(s.forSale >= _amount, "Not enough for sale");

        uint256 totalCost = _amount;
        require(msg.value == totalCost, "Incorrect ETH sent");

        (bool sent, ) = payable(_seller).call{value: msg.value}("");
        require(sent, "Payment failed");

        s.credits -= _amount;
        s.forSale -= _amount;
        buyers[msg.sender] += _amount;
    }
}`;

export const locationOptions = [
  'Sundarbans, West Bengal',
  'Port Blair, Andaman & Nicobar',
  'Chilika Lake, Odisha',
  'Ratnagiri, Maharashtra',
  'Kochi, Kerala',
  'Kutch, Gujarat',
  'Rameshwaram, Tamil Nadu',
  'Mandovi River, Goa',
  'Visakhapatnam, Andhra Pradesh',
  'Mangalore, Karnataka',
  'Mumbai Coast, Maharashtra',
  'Chennai Coast, Tamil Nadu',
  'Puri Coast, Odisha',
  'Kandla, Gujarat',
  'Karwar, Karnataka'
];