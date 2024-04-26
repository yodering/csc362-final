import pandas as pd

def filter_european_competitions(file_path, output_path=None):
    # Load the dataset
    data = pd.read_csv(file_path)

    # List of European countries excluding Russia
    european_countries = [
        "Albania", "Andorra", "Armenia", "Austria", "Belarus", "Belgium",
        "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark",
        "Estonia", "Finland", "France", "Georgia", "Germany", "Greece", "Hungary", "Iceland",
        "Ireland", "Italy", "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg",
        "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia",
        "Norway", "Poland", "Portugal", "Romania", "San Marino", "Serbia", "Slovakia",
        "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom",
        "Vatican City"
    ]

    # Extract just the country name from the 'country' column
    data['clean_country'] = data['country'].apply(lambda x: x.split(',')[0])

    # Filter the dataset for European countries excluding Russia
    filtered_data = data[data['clean_country'].isin(european_countries)]

    # Optional: Save the filtered data to a new CSV file
    if output_path:
        filtered_data.to_csv(output_path, index=False)

    return filtered_data

# Usage of the function
file_path = 'all_comp.csv'  # Path to your original data file
output_path = 'filtered_competitions.csv'  # Path to save the filtered data file
filtered_data = filter_european_competitions(file_path, output_path)
