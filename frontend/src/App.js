import React, { useState } from "react"
import axios from "axios"
// import "./index.css"
import "bootstrap/dist/css/bootstrap.min.css"

function App() {
	const [cardName, setCardName] = useState("")
	const [cardData, setCardData] = useState(null)

	const fetchCardData = async () => {
		try {
			const response = await axios.get(`http://localhost:5000/api/card-data`, {
				params: { cardName },
			})
			setCardData(response.data)
		} catch (error) {
			console.error("Error fetching card data", error)
		}
	}

	return (
		<div className="container my-4">
			<h1 className="text-center">
				Card Price Tracker
			</h1>
			<div className="input-group mb-3">
				<input
					type="text"
					className="form-control"
					placeholder="Enter card name"
					value={cardName}
					onChange={(e) => setCardName(e.target.value)}
				/>
				<button
					className="btn btn-primary"
					onClick={fetchCardData}
				>
					Fetch Data
				</button>
			</div>

			{cardData && (
				<div className="table-responsive">
					<table className="table table-bordered table-hover">
						<thead className="table-dark">
							<tr>
								<th>Card Name</th>
								<th>Card Number</th>
								<th>Rarity</th>
								<th>Ungraded Price</th>
								<th>PSA 10 Price</th>
								<th>Difference</th>
								<th>Profit Potential</th>
							</tr>
						</thead>
						<tbody>
							{cardData.ungradedPrices.map((ungradedPrice, index) => {
								const psaPrice = parseFloat(
									cardData.psa10Prices[index].replace("$", "").replace(",", "")
								)
								const ungradedPriceValue = parseFloat(
									ungradedPrice.replace("$", "").replace(",", "")
								)
								const difference = psaPrice - ungradedPriceValue
								const profitPotential = ((difference / ungradedPriceValue) * 100).toFixed(2)

								return (
									<tr key={index}>
										<td>{cardData.cardName}</td>
										<td>{cardData.cardNumber}</td>
										<td>{cardData.rarity}</td>
										<td>{ungradedPrice}</td>
										<td>{cardData.psa10Prices[index]}</td>
										<td>{`$${difference.toLocaleString()}`}</td>
										<td>{`${profitPotential}%`}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}

export default App
